import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

/**
 * Seeds the database with an admin user for testing
 *
 * Credentials:
 * - Email: admin@invest.com
 * - Password: Admin@123
 */
export async function seedAdminUser(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  // Check if admin user already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@invest.com' },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
    return;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  // Create admin user
  const adminUser = userRepository.create({
    email: 'admin@invest.com',
    password: hashedPassword,
    firstName: 'Admin',
    lastName: 'System',
    isActive: true,
    isEmailVerified: true,
    preferences: {
      language: 'pt-BR',
      theme: 'dark',
      notifications: {
        email: true,
        browser: true,
      },
    },
    notifications: {},
  });

  await userRepository.save(adminUser);

  console.log('✅ Admin user created successfully');
  console.log('📧 Email: admin@invest.com');
  console.log('🔑 Password: Admin@123');
}
