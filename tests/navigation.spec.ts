import { test, expect } from '@playwright/test';

test('vérifier que la page d accueil et le profil chargent', async ({ page }) => {
  // 1. Aller sur l'accueil
  await page.goto('http://localhost:3000');
  
  // 2. Vérifier que le titre contient Comores Market
  await expect(page).toHaveTitle(/Comores Market/);

  // 3. Simuler un clic vers la page compte
  await page.click('a[href="/compte"]');
  
  // 4. Vérifier qu'on est redirigé vers l'auth ou le compte
  await expect(page).toHaveURL(/.*auth|.*compte/);
});