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

/**
 * Genere des variantes progressivement tronquees du code produit.
 * Ex: "03-1043-01-F/M" → ["03-1043-01-M", "03-1043-01", "03-1043"]
 * Supprime d'abord les lettres finales, puis le "/" et les groupes.
 */
export function getProductCodeVariants(productCode: string): string[] {
  const base = transformProductCode(productCode);
  const variants: string[] = [base];

  // Supprimer le dernier groupe s'il est purement alphabetique (ex: -M, -F, -Z)
  const groups = base.split('-');
  if (groups.length > 2) {
    const last = groups[groups.length - 1];
    if (/^[A-Za-z]+$/.test(last)) {
      const trimmed = groups.slice(0, -1).join('-');
      if (!variants.includes(trimmed)) variants.push(trimmed);
    }
  }

  // Supprimer aussi les 2 derniers groupes (ex: 03-1043)
  if (groups.length > 3) {
    const shorter = groups.slice(0, -2).join('-');
    if (shorter.length >= 2 && !variants.includes(shorter)) variants.push(shorter);
  }

  return variants;
}
