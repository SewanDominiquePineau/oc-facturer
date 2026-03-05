/**
 * Transforme le code produit selon la logique metier.
 * Dans la recherche, le code_produit contient plusieurs groupes separes de "-".
 * Si le dernier groupe contient un "/" et si c'est "F/M" garder "M",
 * pour les autres garder le dernier caractere.
 */
export function transformProductCode(productCode: string): string {
  const groups = productCode.split('-');
  if (groups.length === 0) return productCode;

  const lastGroup = groups[groups.length - 1];

  if (lastGroup.includes('/')) {
    if (lastGroup === 'F/M') {
      groups[groups.length - 1] = 'M';
    } else {
      groups[groups.length - 1] = lastGroup.charAt(lastGroup.length - 1);
    }
  }

  return groups.join('-');
}
