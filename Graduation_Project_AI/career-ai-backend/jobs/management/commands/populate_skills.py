from django.core.management.base import BaseCommand
from jobs.models import SkillDatabase
from jobs.skills_data import COMPREHENSIVE_SKILLS_DATABASE


class Command(BaseCommand):
    help = 'Populate the skills database with comprehensive skills data'

    def handle(self, *args, **options):
        self.stdout.write('Populating skills database...')
        
        created_count = 0
        updated_count = 0
        
        for skill_data in COMPREHENSIVE_SKILLS_DATABASE:
            skill, created = SkillDatabase.objects.update_or_create(
                name=skill_data['name'],
                defaults={
                    'category': skill_data['category'],
                    'description': skill_data.get('description', ''),
                    'synonyms': skill_data.get('synonyms', []),
                    'related_skills': skill_data.get('related_skills', []),
                    'proficiency_levels': skill_data.get('proficiency_levels', ['Beginner', 'Intermediate', 'Advanced']),
                    'typical_years_experience': skill_data.get('typical_years_experience'),
                    'demand_level': skill_data.get('demand_level', 3),
                    'industries': skill_data.get('industries', []),
                    'job_titles': skill_data.get('job_titles', []),
                    'technical_weight': skill_data.get('technical_weight', 1.0),
                    'business_weight': skill_data.get('business_weight', 0.5),
                    'creative_weight': skill_data.get('creative_weight', 0.3),
                    'is_active': True
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(f'Created skill: {skill.name} ({skill.get_category_display()})')
            else:
                updated_count += 1
                self.stdout.write(f'Updated skill: {skill.name} ({skill.get_category_display()})')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated skills database!\n'
                f'Created: {created_count} skills\n'
                f'Updated: {updated_count} skills\n'
                f'Total: {created_count + updated_count} skills'
            )
        )
