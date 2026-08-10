import { PasswordHasher } from './password-hasher';

describe('PasswordHasher', () => {
  const hasher = new PasswordHasher();

  it('stores a salted scrypt representation and verifies it', async () => {
    const first = await hasher.hash('a secure demo password');
    const second = await hasher.hash('a secure demo password');

    expect(first).toMatch(/^scrypt\$131072\$8\$1\$/);
    expect(first).not.toBe(second);
    await expect(hasher.verify('a secure demo password', first)).resolves.toBe(
      true,
    );
    await expect(hasher.verify('wrong password', first)).resolves.toBe(false);
  });
});
