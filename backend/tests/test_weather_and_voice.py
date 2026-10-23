from app.services.weather_service import WeatherService
from app.services.gnani_service import GnaniService

def test_imd_rainfall_hazard_rules(app):
    with app.app_context():
        ws = WeatherService()
        mock_weather_data = {
            'success': True,
            'current': {'temperature': 28.0, 'precipitation': 0.0},
            'daily': {
                'time': ['2026-10-25', '2026-10-26'],
                'precipitation_sum': [75.0, 10.0], # 75.0mm exceeds 64.5mm IMD Heavy Rain threshold
                'temperature_2m_max': [32.0, 31.0]
            }
        }
        alerts = ws.evaluate_agricultural_risks(user_id=1, farm=None, weather_data=mock_weather_data)
        assert len(alerts) == 1
        assert alerts[0].hazard_type == 'heavy_rainfall'
        assert alerts[0].severity == 'watch'

def test_imd_heatwave_hazard_rules(app):
    with app.app_context():
        ws = WeatherService()
        mock_weather_data = {
            'success': True,
            'current': {'temperature': 39.0, 'precipitation': 0.0},
            'daily': {
                'time': ['2026-10-25', '2026-10-26'],
                'precipitation_sum': [0.0, 0.0],
                'temperature_2m_max': [42.5, 38.0] # 42.5°C exceeds 40°C IMD heat threshold
            }
        }
        alerts = ws.evaluate_agricultural_risks(user_id=1, farm=None, weather_data=mock_weather_data)
        assert len(alerts) == 1
        assert alerts[0].hazard_type == 'heatwave'

def test_gnani_service_configuration():
    gs = GnaniService(api_key='vach_test_key_123')
    assert gs.is_configured() is True
    
    gs_unconfigured = GnaniService(api_key='your_gnani_api_key_here')
    assert gs_unconfigured.is_configured() is False

def test_voice_health_endpoint(client):
    res = client.get('/api/v1/voice/health')
    assert res.status_code == 200
    data = res.get_json()
    assert 'status' in data
    assert 'configured' in data
