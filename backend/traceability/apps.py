# traceability/apps.py

from django.apps import AppConfig


class TraceabilityConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'traceability'
    
    def ready(self):
        """Importer les signaux quand l'application est prête."""
        import traceability.signals 