import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

/**
 * Seeds the database with admin users for testing
 *
 * Credentials:
 * - Email: admin@invest.com / Password: Admin@123
 * - Email: root@invest.com / Password: adria
 */
export async function seedAdminUser(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  // === ADMIN USER ===
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@invest.com' },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
  } else {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
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

  // === ROOT USER ===
  const existingRoot = await userRepository.findOne({
    where: { email: 'root@invest.com' },
  });

  if (existingRoot) {
    console.log('✅ Root user already exists');
  } else {
    const hashedRootPassword = await bcrypt.hash('adria', 10);
    const rootUser = userRepository.create({
      email: 'root@invest.com',
      password: hashedRootPassword,
      firstName: 'Root',
      lastName: 'Administrator',
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
    await userRepository.save(rootUser);
    console.log('✅ Root user created successfully');
    console.log('📧 Email: root@invest.com');
    console.log('🔑 Password: adria');
  }
}
