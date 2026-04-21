from django.db.models.signals import pre_delete
from django.dispatch import receiver
import cloudinary.uploader
from .models import Assignment # Import model của bạn

@receiver(pre_delete, sender=Assignment)
def delete_assignment_file(sender, instance, **kwargs):
    if instance.assignment_url:
        try:
            p_id = instance.assignment_url.public_id
            url = instance.assignment_url.url
            ext = url.split('.')[-1]
            full_p_id = f"{p_id}.{ext}"
            
            print(f"--- [SIGNALS] Đang dọn dẹp mây: {full_p_id} ---")
            cloudinary.uploader.destroy(full_p_id, resource_type='raw')
        except Exception as e:
            print(f"--- [SIGNALS] Lỗi: {e} ---")