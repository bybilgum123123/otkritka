export async function unlockForQA(page) {
  if (await page.locator('#love-password').count() === 0) return;
  if (!process.env.LOVE_PASSWORD) throw new Error('Set LOVE_PASSWORD in the test environment to verify the private card.');
  const origin = new URL(page.url()).origin;
  const response = await page.request.post(origin + '/api/access', {
    headers: { Origin: origin }, data: { password: process.env.LOVE_PASSWORD },
  });
  if (!response.ok()) throw new Error('Test login failed. Check the test environment configuration.');
  await page.reload();
}
