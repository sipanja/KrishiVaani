import os
import hashlib
import logging
from datetime import datetime, timezone, timedelta
import requests
from ..models import db, WeatherAlertRecord, Farm

logger = logging.getLogger(__name__)

# IMD Rainfall Classification Reference:
# Very Light: 0.1 - 2.4 mm
# Light: 2.5 - 15.5 mm
# Moderate: 15.6 - 64.4 mm
# Heavy Rain: 64.5 - 115.5 mm (Yellow/Orange Alert)
# Very Heavy: 115.6 - 204.4 mm (Orange/Red Alert)
# Extremely Heavy: > 204.5 mm (Red Alert)

# WMO Weather code interpretations for agriculture
WMO_CODE_MAP = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
}

class WeatherService:
    def __init__(self):
        self.base_url = 'https://api.open-meteo.com/v1/forecast'

    def fetch_weather_for_coords(self, lat: float, lon: float) -> dict:
        """
        Fetches live meteorological observations and 7-day outlook from Open-Meteo API.
        """
        params = {
            'latitude': lat,
            'longitude': lon,
            'current': 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m',
            'daily': 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
            'timezone': 'auto'
        }

        try:
            resp = requests.get(self.base_url, params=params, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get('current', {})
                daily = data.get('daily', {})
                
                weather_code = current.get('weather_code', 0)
                condition = WMO_CODE_MAP.get(weather_code, 'Unknown')
                
                return {
                    'success': True,
                    'latitude': lat,
                    'longitude': lon,
                    'elevation': data.get('elevation'),
                    'timezone': data.get('timezone'),
                    'fetched_at': datetime.now(timezone.utc).isoformat(),
                    'is_stale': False,
                    'current': {
                        'temperature': current.get('temperature_2m'),
                        'feels_like': current.get('apparent_temperature'),
                        'humidity': current.get('relative_humidity_2m'),
                        'precipitation_mm': current.get('precipitation', 0.0),
                        'wind_speed_kmh': current.get('wind_speed_10m'),
                        'weather_code': weather_code,
                        'condition': condition
                    },
                    'daily': daily,
                    'source': 'Open-Meteo (ECMWF/GFS numerical forecast with IMD threshold analysis)'
                }
            else:
                logger.error(f"Weather API returned status {resp.status_code}")
                return {
                    'success': False,
                    'error': f'Weather service responded with error code {resp.status_code}',
                    'is_stale': True
                }
        except requests.exceptions.Timeout:
            return {
                'success': False,
                'error': 'Weather service request timed out.',
                'is_stale': True
            }
        except Exception as e:
            logger.error(f"Weather fetch error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to fetch weather: {str(e)}',
                'is_stale': True
            }

    def evaluate_agricultural_risks(self, user_id: int, farm: Farm, weather_data: dict) -> list:
        """
        Evaluates weather conditions against official IMD hazard criteria and generates
        traceable, deduplicated alert records in the database.
        """
        if not weather_data or not weather_data.get('success'):
            return []

        alerts_created = []
        current = weather_data.get('current', {})
        daily = weather_data.get('daily', {})
        
        daily_precip = daily.get('precipitation_sum', [])
        daily_temp_max = daily.get('temperature_2m_max', [])
        daily_times = daily.get('time', [])
        
        now = datetime.now(timezone.utc)
        
        # 1. IMD Heavy Rainfall Risk Evaluation (> 64.5 mm in 24h)
        for idx, p_sum in enumerate(daily_precip[:3]): # Next 3 days
            if p_sum and p_sum >= 64.5:
                day_str = daily_times[idx] if idx < len(daily_times) else 'the coming days'
                severity = 'warning' if p_sum >= 115.6 else 'watch'
                title = f"Heavy Rainfall Alert ({p_sum:.1f} mm expected)"
                desc = (
                    f"IMD criteria heavy precipitation forecast on {day_str} ({p_sum:.1f} mm). "
                    f"Ensure drainage channels in your fields are cleared immediately to prevent waterlogging and root rot. "
                    f"Postpone planned pesticide spraying and fertilizer application until rainfall subsides."
                )
                
                # Deduplication key
                dedup_str = f"{user_id}_{farm.id if farm else 0}_heavy_rain_{day_str}_{round(p_sum, -1)}"
                dedup_hash = hashlib.sha256(dedup_str.encode()).hexdigest()
                
                existing = WeatherAlertRecord.query.filter_by(dedup_hash=dedup_hash).first()
                if not existing:
                    alert = WeatherAlertRecord(
                        user_id=user_id,
                        farm_id=farm.id if farm else None,
                        title=title,
                        description=desc,
                        severity=severity,
                        hazard_type='heavy_rainfall',
                        source='IMD Quantitative Precipitation Criteria & Model Forecast',
                        is_official_warning=False,
                        valid_from=now,
                        valid_to=now + timedelta(days=2),
                        dedup_hash=dedup_hash
                    )
                    db.session.add(alert)
                    alerts_created.append(alert)

        # 2. IMD Heatwave Criteria Evaluation (> 40°C in plains)
        for idx, t_max in enumerate(daily_temp_max[:3]):
            if t_max and t_max >= 40.0:
                day_str = daily_times[idx] if idx < len(daily_times) else 'the coming days'
                severity = 'warning' if t_max >= 44.0 else 'advisory'
                title = f"High Temperature / Heat Stress Advisory ({t_max:.1f}°C)"
                desc = (
                    f"Maximum temperature forecasted to reach {t_max:.1f}°C on {day_str}. "
                    f"Apply light and frequent evening irrigation to maintain soil moisture and mitigate heat shock to standing crops."
                )
                
                dedup_str = f"{user_id}_{farm.id if farm else 0}_heatwave_{day_str}_{round(t_max)}"
                dedup_hash = hashlib.sha256(dedup_str.encode()).hexdigest()
                
                existing = WeatherAlertRecord.query.filter_by(dedup_hash=dedup_hash).first()
                if not existing:
                    alert = WeatherAlertRecord(
                        user_id=user_id,
                        farm_id=farm.id if farm else None,
                        title=title,
                        description=desc,
                        severity=severity,
                        hazard_type='heatwave',
                        source='IMD Heatwave Advisory Criteria (Plains Threshold)',
                        is_official_warning=False,
                        valid_from=now,
                        valid_to=now + timedelta(days=2),
                        dedup_hash=dedup_hash
                    )
                    db.session.add(alert)
                    alerts_created.append(alert)

        if alerts_created:
            try:
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                logger.error(f"Failed to commit weather alerts: {str(e)}")

        return alerts_created
