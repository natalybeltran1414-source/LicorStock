from django.db import models
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    ROLES = (
        ('ADMIN', 'Administrador'),
        ('VENDEDOR', 'Vendedor'),
    )
    rol = models.CharField(max_length=20, choices=ROLES, default='VENDEDOR')
    estado = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.username} - {self.get_rol_display()}"
