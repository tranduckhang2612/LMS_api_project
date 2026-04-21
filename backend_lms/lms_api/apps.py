from django.apps import AppConfig


class LmsApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'lms_api'

    def ready(self):
        # Quan trọng: Import file signals ở đây để Django nạp nó khi khởi động
        import lms_api.signals
