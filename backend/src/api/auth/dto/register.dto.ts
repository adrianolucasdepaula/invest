import { IsEmail, IsString, MinLength, IsOptional, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @MaxLength(100, { message: 'Senha deve ter no máximo 100 caracteres' })
  password: string;

  @IsString({ message: 'Nome deve ser uma string' })
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @IsString({ message: 'Sobrenome deve ser uma string' })
  @IsOptional()
  @MaxLength(100)
  lastName?: string;
}
