/**
 * Migration script: Hash all plaintext passwords in the database.
 * Run once: npx ts-node scripts/migrate-passwords.ts
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../src/entities/user.entity';

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'yunyu_learning',
  entities: [User],
  synchronize: false,
});

async function migratePasswords() {
  console.log('🔄 Starting password migration...');

  await dataSource.initialize();
  console.log('✅ Database connected');

  const userRepo = dataSource.getRepository(User);

  // Find all users with plaintext passwords (those that start with Qima, Admin, or are shorter than 60 chars which is bcrypt length)
  // Bcrypt hashes are always 60 characters
  const users = await userRepo.find();

  let migrated = 0;
  let alreadyHashed = 0;
  let failed = 0;

  for (const user of users) {
    try {
      const password = user.password;

      // Skip if already a bcrypt hash (60 chars)
      if (password && password.length === 60 && password.includes('$')) {
        // Verify it's a valid bcrypt hash by trying to compare with itself
        const isBcrypt = password.startsWith('$2');
        if (isBcrypt) {
          alreadyHashed++;
          console.log(`  ⏭️  User ${user.username} (id=${user.id}) already has hashed password`);
          continue;
        }
      }

      // Check if it's a known default password that needs hashing
      if (password === 'Qima@2024' || password === 'Admin@2024' || password.length < 60) {
        // Re-hash the existing password (we assume it's still the original default)
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await userRepo.save(user);
        migrated++;
        console.log(`  ✅ User ${user.username} (id=${user.id}) password hashed`);
      } else {
        // Unknown password format - hash it as-is (safest approach)
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await userRepo.save(user);
        migrated++;
        console.log(`  ✅ User ${user.username} (id=${user.id}) password hashed (unknown format)`);
      }
    } catch (error) {
      failed++;
      console.error(`  ❌ Failed to migrate user ${user.username} (id=${user.id}): ${error.message}`);
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`  ✅ Migrated: ${migrated}`);
  console.log(`  ⏭️  Already hashed: ${alreadyHashed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📝 Total: ${users.length}`);

  await dataSource.destroy();
  console.log('\n✨ Migration complete!');
}

migratePasswords().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
