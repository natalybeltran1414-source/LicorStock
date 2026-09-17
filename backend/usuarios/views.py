from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (UsuarioSerializer, LoginSerializer, RegisterSerializer,
                          CambiarPasswordSerializer)


class LoginView(TokenObtainPairView):
    """Inicia sesión y devuelve tokens JWT junto con los datos del usuario."""
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    """Invalida el refresh token entregado."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh = request.data.get('refresh')
        if not refresh:
            return Response({'detail': 'Se requiere el refresh token.'}, status=400)
        try:
            RefreshToken(refresh).blacklist()
        except Exception:
            return Response({'detail': 'Token inválido.'}, status=400)
        return Response({'detail': 'Sesión cerrada correctamente.'})


class MeView(generics.RetrieveUpdateAPIView):
    """Devuelve y permite actualizar los datos del usuario autenticado."""
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class CambiarPasswordView(APIView):
    """Permite al usuario autenticado cambiar su contraseña."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CambiarPasswordSerializer(
            data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        usuario = request.user
        usuario.set_password(serializer.validated_data['nueva_password'])
        usuario.save(update_fields=['password'])
        return Response({'detail': 'Contraseña actualizada correctamente.'})


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
