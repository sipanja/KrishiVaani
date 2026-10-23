from datetime import datetime, timezone
from . import db

class AgriculturalKnowledge(db.Model):
    __tablename__ = 'agricultural_knowledge'

    id = db.Column(db.Integer, primary_key=True)
    crop_name = db.Column(db.String(100), nullable=False, index=True) # e.g. 'Paddy (Rice)', 'Wheat', 'Cotton'
    topic = db.Column(db.String(200), nullable=False, index=True)     # e.g. 'Blast (Pyricularia oryzae)', 'Pink Bollworm'
    category = db.Column(db.String(80), default='disease', nullable=False) # 'disease', 'pest', 'nutrition', 'water_management'
    
    symptoms = db.Column(db.Text, nullable=False)
    favorable_conditions = db.Column(db.Text, nullable=True) # e.g. 'High humidity > 90%, cloudy weather'
    cultural_control = db.Column(db.Text, nullable=False)    # Organic, cultural, IPM practices
    biological_control = db.Column(db.Text, nullable=True)
    chemical_guidelines_caution = db.Column(db.Text, nullable=True) # Qualified, official IPM recommendations with safety caution
    
    # Official Source Provenance
    source_institution = db.Column(db.String(200), nullable=False) # e.g. 'ICAR - National Rice Research Institute (NRRI)'
    source_url = db.Column(db.String(255), nullable=True)
    publication_year = db.Column(db.String(20), nullable=True)
    verified = db.Column(db.Boolean, default=True, nullable=False)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'crop_name': self.crop_name,
            'topic': self.topic,
            'category': self.category,
            'symptoms': self.symptoms,
            'favorable_conditions': self.favorable_conditions,
            'cultural_control': self.cultural_control,
            'biological_control': self.biological_control,
            'chemical_guidelines_caution': self.chemical_guidelines_caution,
            'source_institution': self.source_institution,
            'source_url': self.source_url,
            'publication_year': self.publication_year
        }
