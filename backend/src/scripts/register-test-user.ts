import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../api/auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);

  try {
    console.log('Registering test user...');
    const result = await authService.register({
      email: 'test_verifier@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Verifier',
    });
    console.log('User registered:', result);
  } catch (error) {
    console.error('Registration failed:', error.message);
  } finally {
    await app.close();
  }
}
bootstrap();
