from django.core.management.base import BaseCommand
from jobs.job_sync_service import sync_jobs


class Command(BaseCommand):
    help = 'Sync jobs from external APIs (JSearch, Remotive, Arbeitnow) into the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Enable verbose output',
        )

    def handle(self, *args, **options):
        self.stdout.write('Starting job sync from external APIs...')
        
        try:
            results = sync_jobs()
            
            if 'error' in results:
                self.stdout.write(
                    self.style.ERROR(f'Sync failed: {results["error"]}')
                )
                return
            
            total_added = results.get('total_jobs_added', 0)
            total_updated = results.get('total_jobs_updated', 0)
            
            self.stdout.write(
                self.style.SUCCESS(f'Sync completed successfully!')
            )
            self.stdout.write(f'Jobs added: {total_added}')
            self.stdout.write(f'Jobs updated: {total_updated}')
            
            if options['verbose']:
                self.stdout.write('\nDetailed results:')
                for source, source_results in results.get('sources', {}).items():
                    if 'error' in source_results:
                        self.stdout.write(
                            self.style.ERROR(f'{source}: {source_results["error"]}')
                        )
                    else:
                        added = source_results.get('jobs_added', 0)
                        updated = source_results.get('jobs_updated', 0)
                        self.stdout.write(f'{source}: {added} added, {updated} updated')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Unexpected error: {str(e)}')
            )
            raise
