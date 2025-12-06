import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '@database/entities';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword123',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    lastLogin: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);

    mockJwtService.sign.mockReturnValue('jwt-token-123');
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };

    it('should register a new user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({
        ...registerDto,
        password: 'hashedPassword',
        id: 'new-user-id',
      });
      mockUserRepository.save.mockResolvedValue({
        ...registerDto,
        password: 'hashedPassword',
        id: 'new-user-id',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should hash the password before saving', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ id: 'new-id' });
      mockUserRepository.save.mockResolvedValue({ id: 'new-id', email: registerDto.email });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('should throw UnauthorizedException if user already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'User already exists',
      );
    });

    it('should return JWT token', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ id: 'new-id' });
      mockUserRepository.save.mockResolvedValue({ id: 'new-id', email: registerDto.email });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(registerDto);

      expect(result.token).toBe('jwt-token-123');
      expect(mockJwtService.sign).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should update lastLogin on successful login', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser });
      mockUserRepository.save.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login(loginDto);

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          lastLogin: expect.any(Date),
        }),
      );
    });

    it('should not return password in user object', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw if user has no password set', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, password: null });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('googleLogin', () => {
    const googleProfile = {
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
      picture: 'https://example.com/avatar.jpg',
      googleId: 'google-123',
    };

    it('should create new user for first Google login', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({
        id: 'new-google-user',
        ...googleProfile,
        isEmailVerified: true,
      });
      mockUserRepository.save.mockResolvedValue({
        id: 'new-google-user',
        ...googleProfile,
        isEmailVerified: true,
      });

      const result = await service.googleLogin(googleProfile);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: googleProfile.email,
          googleId: googleProfile.googleId,
          isEmailVerified: true,
        }),
      );
    });

    it('should link Google account to existing user', async () => {
      const existingUser = { ...mockUser, googleId: null };
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue({
        ...existingUser,
        googleId: googleProfile.googleId,
      });

      const result = await service.googleLogin(googleProfile);

      expect(result).toHaveProperty('token');
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          googleId: googleProfile.googleId,
        }),
      );
    });

    it('should not update googleId if already set', async () => {
      const existingUser = { ...mockUser, googleId: 'existing-google-id' };
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue(existingUser);

      await service.googleLogin(googleProfile);

      // Save is called for lastLogin update, not googleId update
      expect(mockUserRepository.save).not.toHaveBeenCalledWith(
        expect.objectContaining({
          googleId: googleProfile.googleId,
        }),
      );
    });

    it('should update lastLogin on Google login', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, googleId: 'google-123' });
      mockUserRepository.save.mockResolvedValue(mockUser);

      await service.googleLogin(googleProfile);

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          lastLogin: expect.any(Date),
        }),
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if found and active', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-123');

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.validateUser('invalid-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(service.validateUser('user-123')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateUser('user-123')).rejects.toThrow(
        'User not found or inactive',
      );
    });
  });
});
