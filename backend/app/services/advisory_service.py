import os
import json
import logging
from ..models import db, AgriculturalKnowledge, CropIssue, CropCycle, FarmerProfile

logger = logging.getLogger(__name__)

class AdvisoryService:
    def ensure_knowledge_base_seeded(self):
        """
        Ensures verified ICAR / State Agricultural University reference packages are loaded into the database.
        Does NOT insert fake farmers or demo user records.
        """
        count = AgriculturalKnowledge.query.count()
        if count == 0:
            json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'knowledge_base.json')
            if os.path.exists(json_path):
                try:
                    with open(json_path, 'r', encoding='utf-8') as f:
                        records = json.load(f)
                        for item in records:
                            doc = AgriculturalKnowledge(
                                crop_name=item['crop_name'],
                                topic=item['topic'],
                                category=item.get('category', 'disease'),
                                symptoms=item['symptoms'],
                                favorable_conditions=item.get('favorable_conditions'),
                                cultural_control=item['cultural_control'],
                                biological_control=item.get('biological_control'),
                                chemical_guidelines_caution=item.get('chemical_guidelines_caution'),
                                source_institution=item['source_institution'],
                                source_url=item.get('source_url'),
                                publication_year=item.get('publication_year'),
                                verified=True
                            )
                            db.session.add(doc)
                    db.session.commit()
                    logger.info(f"Loaded {len(records)} verified agricultural knowledge entries.")
                except Exception as e:
                    db.session.rollback()
                    logger.error(f"Error seeding knowledge base: {str(e)}")

    def search_knowledge(self, crop_name: str = None, query: str = '') -> list:
        """
        Searches verified agricultural knowledge by crop name and symptoms.
        """
        self.ensure_knowledge_base_seeded()
        query_terms = [t.lower() for t in query.split() if len(t) > 2]
        
        q = AgriculturalKnowledge.query
        if crop_name:
            # Match specific crop
            q = q.filter(AgriculturalKnowledge.crop_name.ilike(f"%{crop_name.split()[0]}%"))
            
        all_docs = q.all()
        scored_results = []
        for doc in all_docs:
            score = 0
            text_corpus = f"{doc.crop_name} {doc.topic} {doc.symptoms} {doc.favorable_conditions or ''}".lower()
            for term in query_terms:
                if term in text_corpus:
                    score += 1
            if score > 0 or not query_terms:
                scored_results.append((score, doc))
                
        scored_results.sort(key=lambda x: x[0], reverse=True)
        return [doc for score, doc in scored_results[:4]]

    def analyze_crop_problem(self, crop: CropCycle, symptoms: str, farmer_profile: FarmerProfile = None) -> dict:
        """
        Analyzes farmer-reported symptoms against verified knowledge,
        determines confidence level, generates clarifying questions if needed,
        and constructs evidence-grounded recommendations.
        """
        self.ensure_knowledge_base_seeded()
        crop_name = crop.crop_name if crop else 'Paddy (Rice)'
        matches = self.search_knowledge(crop_name=crop_name, query=symptoms)
        
        is_hindi = farmer_profile and farmer_profile.preferred_language == 'hi'

        if not matches:
            # Fallback when no direct match in current verified library
            if is_hindi:
                advice = (
                    f"आपके {crop_name} में बताए गए लक्षणों ('{symptoms}') के लिए हमारे प्रमाणित डेटाबेस में सटीक पुष्टि नहीं मिली है। "
                    f"सुरक्षा के लिए, बिना विशेषज्ञ पुष्टि के कोई रासायनिक छिड़काव न करें। "
                    f"कृपया अपने नजदीकी कृषि विज्ञान केंद्र (KVK) या प्रखंड कृषि अधिकारी से संपर्क करें।"
                )
                clarifying = [
                    "क्या यह लक्षण नई पत्तियों पर है या पुरानी निचली पत्तियों पर?",
                    "क्या पत्तियों पर धब्बे, कीड़े या जाला दिखाई दे रहा है?",
                    "क्या खेत में पानी जमा हुआ है?"
                ]
            else:
                advice = (
                    f"For the symptoms reported in your {crop_name} ('{symptoms}'), no exact match was confirmed in our verified ICAR/SAU advisory records. "
                    f"For safety, do not apply chemical pesticides without physical inspection. "
                    f"Please consult your local Krishi Vigyan Kendra (KVK) or Block Agriculture Officer."
                )
                clarifying = [
                    "Are the symptoms appearing on the upper young leaves or lower mature leaves?",
                    "Are there visible fungal spots, insects, or webbing?",
                    "Is there excess water stagnation in the field?"
                ]

            return {
                'diagnosis_estimate': f"Undetermined symptom on {crop_name}",
                'confidence': 'insufficient_data',
                'severity': 'moderate',
                'guidance_notes': advice,
                'clarifying_questions': clarifying,
                'sources': [],
                'expert_referred': True,
                'expert_referral_reason': 'Symptoms do not match verified local diseases with sufficient certainty.'
            }

        primary = matches[0]
        # Evaluate confidence
        matched_words = sum(1 for word in symptoms.lower().split() if word in primary.symptoms.lower())
        confidence = 'probable' if matched_words >= 2 else 'preliminary'
        
        sources = [{
            'institution': primary.source_institution,
            'source_url': primary.source_url,
            'topic': primary.topic,
            'year': primary.publication_year
        }]

        if is_hindi:
            guidance = (
                f"**लक्षण विश्लेषण (संभावित):** {primary.topic}\n\n"
                f"**सांस्कृतिक/जैविक उपाय (तुरंत करने योग्य):**\n"
                f"• {primary.cultural_control}\n"
                f"• {primary.biological_control or 'जैविक उपचार उपलब्ध होने पर ही अपनाएं।'}\n\n"
                f"**सावधानी एवं रासायनिक सलाह:**\n"
                f"• {primary.chemical_guidelines_caution}\n\n"
                f"*स्त्रोत: {primary.source_institution} ({primary.publication_year or 'प्रमाणित'})*"
            )
            clarifying = [
                "क्या यह धब्बे या लक्षण खेत के अन्य पौधों में भी फैल रहे हैं?",
                "क्या आपने हाल ही में कोई यूरिया या उर्वरक डाला था?",
                "क्या आप पत्ती की एक स्पष्ट तस्वीर साझा कर सकते हैं?"
            ]
        else:
            guidance = (
                f"**Preliminary Diagnosis:** Suspected {primary.topic} on {crop_name}.\n\n"
                f"**Recommended Cultural & Bio-Controls:**\n"
                f"• {primary.cultural_control}\n"
                f"• {primary.biological_control or 'Use certified bio-agents where available.'}\n\n"
                f"**Management Precautions:**\n"
                f"• {primary.chemical_guidelines_caution}\n\n"
                f"*Source: {primary.source_institution} ({primary.publication_year or 'Verified'})*"
            )
            clarifying = [
                "Are the symptoms spreading to neighbouring plants or patches?",
                "Have you applied high doses of nitrogen/urea recently?",
                "Could you upload a clear close-up photograph of the affected leaf?"
            ]

        return {
            'diagnosis_estimate': f"Suspected {primary.topic}",
            'confidence': confidence,
            'severity': 'moderate',
            'guidance_notes': guidance,
            'clarifying_questions': clarifying,
            'sources': sources,
            'expert_referred': confidence == 'preliminary',
            'expert_referral_reason': 'Preliminary identification; confirm with local KVK before chemical treatment.' if confidence == 'preliminary' else None
        }

    def answer_query(self, user_query: str, farmer_profile: FarmerProfile = None, active_crop: CropCycle = None) -> dict:
        """
        Answers general or crop-specific farming inquiries using source-grounded RAG.
        """
        self.ensure_knowledge_base_seeded()
        crop_hint = active_crop.crop_name if active_crop else None
        matches = self.search_knowledge(crop_name=crop_hint, query=user_query)
        
        is_hindi = farmer_profile and farmer_profile.preferred_language == 'hi'

        if not matches:
            if is_hindi:
                response_text = (
                    f"कृषिवाणी सहायक: आपके प्रश्न ('{user_query}') के संबंध में हमारे पास प्रमाणित संदर्भ उपलब्ध नहीं है। "
                    f"गलत सलाह से बचने के लिए हम मनगढ़ंत उत्तर नहीं देते। "
                    f"कृपया अपनी फसल का नाम और विशिष्ट समस्या बताएं या अपने निकटतम कृषि विज्ञान केंद्र (KVK) से संपर्क करें।"
                )
            else:
                response_text = (
                    f"KrishiVaani Advisory: We do not have verified agricultural records directly answering '{user_query}'. "
                    f"To prevent crop damage, we do not fabricate unverified guidance. "
                    f"Please specify your crop name and symptoms, or consult your nearest Krishi Vigyan Kendra (KVK)."
                )
            return {
                'answer': response_text,
                'sources': [],
                'suggested_actions': ["Report a Crop Issue", "Check Weather Risk"]
            }

        top_match = matches[0]
        sources = [{
            'institution': top_match.source_institution,
            'source_url': top_match.source_url,
            'topic': top_match.topic,
            'year': top_match.publication_year
        }]

        if is_hindi:
            answer_text = (
                f"**विषय:** {top_match.crop_name} - {top_match.topic}\n\n"
                f"**पहचान व लक्षण:** {top_match.symptoms}\n\n"
                f"**प्रबंधन (IPM):**\n"
                f"• {top_match.cultural_control}\n"
                f"• {top_match.biological_control or ''}\n\n"
                f"**सावधानी:** {top_match.chemical_guidelines_caution}\n\n"
                f"*(स्त्रोत: {top_match.source_institution})*"
            )
        else:
            answer_text = (
                f"**Topic:** {top_match.crop_name} — {top_match.topic}\n\n"
                f"**Symptoms & Identification:** {top_match.symptoms}\n\n"
                f"**Recommended Management (IPM):**\n"
                f"• {top_match.cultural_control}\n"
                f"• {top_match.biological_control or ''}\n\n"
                f"**Safety Precaution:** {top_match.chemical_guidelines_caution}\n\n"
                f"*(Source: {top_match.source_institution})*"
            )

        return {
            'answer': answer_text,
            'sources': sources,
            'suggested_actions': ["Report Crop Issue", "Schedule Observation", "View Weather Forecast"]
        }
