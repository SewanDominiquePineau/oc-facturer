'use client';

import { useState } from 'react';
import styled from 'styled-components';

const PageWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const Nav = styled.nav`
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 1px solid #E5E7EB;
  padding-bottom: 0;
  overflow-x: auto;
`;

const NavTab = styled.button<{ $active: boolean }>`
  padding: 10px 16px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: ${p => (p.$active ? '#191F22' : '#6B7280')};
  border-bottom: 2px solid ${p => (p.$active ? '#3B82F6' : 'transparent')};
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: #191F22;
  }
`;

const Section = styled.section`
  margin-bottom: 32px;
`;

const Title = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #191F22;
  margin: 0 0 16px;
`;

const SubTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #191F22;
  margin: 24px 0 8px;
`;

const P = styled.p`
  font-size: 14px;
  line-height: 1.7;
  color: #333F44;
  margin: 0 0 12px;
`;

const StepList = styled.ol`
  margin: 8px 0 16px;
  padding-left: 24px;
  font-size: 14px;
  line-height: 1.8;
  color: #333F44;
`;

const BulletList = styled.ul`
  margin: 8px 0 16px;
  padding-left: 24px;
  font-size: 14px;
  line-height: 1.8;
  color: #333F44;
`;

const Kbd = styled.kbd`
  display: inline-block;
  padding: 1px 6px;
  border: 1px solid #D9DEE1;
  border-radius: 4px;
  background: #F9FAFB;
  font-size: 12px;
  font-family: monospace;
  color: #191F22;
`;

const Dot = styled.span<{ $color: string }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${p => p.$color};
  margin-right: 4px;
  vertical-align: middle;
`;

const Badge = styled.span<{ $bg: string; $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  background: ${p => p.$bg};
  color: ${p => p.$color};
  white-space: nowrap;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin: 12px 0 20px;

  th, td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #E5E7EB;
  }

  th {
    background: #F9FAFB;
    font-weight: 600;
    color: #191F22;
  }

  td {
    color: #333F44;
  }
`;

const Tip = styled.div`
  background: #EFF6FF;
  border-left: 3px solid #3B82F6;
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
  margin: 16px 0;
  font-size: 13px;
  color: #1E40AF;
  line-height: 1.6;
`;

const Warning = styled.div`
  background: #FFFBEB;
  border-left: 3px solid #F59E0B;
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
  margin: 16px 0;
  font-size: 13px;
  color: #92400E;
  line-height: 1.6;
`;

const VersionInfo = styled.div`
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #E5E7EB;
  font-size: 12px;
  color: #9CA3AF;
`;

type TabId = 'accueil' | 'validation-bdc' | 'facturation' | 'statuts' | 'faq';

const tabs: { id: TabId; label: string }[] = [
  { id: 'accueil', label: 'Presentation' },
  { id: 'validation-bdc', label: 'Validation BDC' },
  { id: 'facturation', label: 'Facturation' },
  { id: 'statuts', label: 'Statuts & regles' },
  { id: 'faq', label: 'FAQ' },
];

function Accueil() {
  return (
    <>
      <Section>
        <Title>OC-Facturer - Guide utilisateur</Title>
        <P>
          OC-Facturer est l&apos;outil de gestion de la facturation des bons de commande (BDC).
          Il permet aux equipes ADV de faire le lien entre les BDC internes et les contrats
          Sophia pour creer les articles de facturation.
        </P>
        <SubTitle>Les deux ecrans principaux</SubTitle>
        <Table>
          <thead>
            <tr>
              <th>Page</th>
              <th>Acces</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Validation BDC</strong></td>
              <td>Menu lateral</td>
              <td>Associer un contrat Sophia a chaque BDC</td>
            </tr>
            <tr>
              <td><strong>A Facturer</strong></td>
              <td>Menu lateral</td>
              <td>Creer les articles de facturation dans Sophia pour chaque ressource</td>
            </tr>
          </tbody>
        </Table>
      </Section>

      <Section>
        <SubTitle>Flux de travail general</SubTitle>
        <StepList>
          <li>Un commercial cree un BDC dans OC (autre application)</li>
          <li>Le BDC apparait dans <strong>Validation BDC</strong> avec le statut &quot;sans contrat&quot;</li>
          <li>L&apos;ADV recherche et associe le contrat Sophia correspondant</li>
          <li>Les ressources du BDC apparaissent dans <strong>A Facturer</strong></li>
          <li>L&apos;ADV complete les informations (site, produit) et ajoute chaque article dans le GDC Sophia</li>
          <li>L&apos;article passe en statut INPROGRESS puis ACTIVATED</li>
        </StepList>
        <Tip>
          <strong>Astuce :</strong> Les donnees se rafraichissent automatiquement toutes les 30 secondes.
          Vous pouvez aussi recharger la page pour forcer la mise a jour.
        </Tip>
      </Section>

      <Section>
        <SubTitle>Navigation</SubTitle>
        <BulletList>
          <li><strong>Menu lateral gauche</strong> : Acceder aux pages Validation BDC, A Facturer et cette aide</li>
          <li><strong>Barre superieure</strong> : Titre de la page en cours, liens vers Sophia</li>
          <li><strong>Barre Sophia</strong> (bandeau bleu fonce) : Liens directs vers Sophia Live V3 et Go V4</li>
        </BulletList>
      </Section>
    </>
  );
}

function ValidationBdc() {
  return (
    <>
      <Section>
        <Title>Validation BDC</Title>
        <P>
          Cet ecran liste tous les bons de commande valides (statut 3) non annules.
          L&apos;objectif est d&apos;associer un contrat Sophia a chaque BDC pour permettre la facturation.
        </P>

        <SubTitle>1. Filtrer les BDC</SubTitle>
        <P>Le menu deroulant en haut a gauche permet de filtrer :</P>
        <Table>
          <thead>
            <tr>
              <th>Filtre</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tous</td>
              <td>Affiche tous les BDC valides</td>
            </tr>
            <tr>
              <td>Sans contrat</td>
              <td>BDC qui n&apos;ont pas encore de contrat Sophia associe</td>
            </tr>
            <tr>
              <td>+ 1 mois</td>
              <td>BDC crees depuis plus d&apos;un mois (a traiter en priorite)</td>
            </tr>
            <tr>
              <td>Enregistre</td>
              <td>BDC qui ont deja un contrat Sophia</td>
            </tr>
          </tbody>
        </Table>
        <P>La barre de recherche filtre par numero BDC, nom client ou commercial.</P>

        <SubTitle>2. Selectionner un BDC</SubTitle>
        <P>
          Cliquez sur une ligne du tableau pour la selectionner. Le panneau droit affiche
          les details du contrat associe (s&apos;il existe) et permet d&apos;en rechercher un nouveau.
        </P>

        <SubTitle>3. Associer un contrat</SubTitle>
        <StepList>
          <li>Selectionnez un BDC dans le tableau</li>
          <li>Dans le panneau droit, tapez au moins 2 caracteres dans le champ de recherche</li>
          <li>Les contrats Sophia correspondants apparaissent</li>
          <li>Cliquez sur le contrat souhaite</li>
          <li>Si le contrat a plusieurs entites de facturation, selectionnez la bonne dans le menu deroulant</li>
          <li>Cliquez <strong>&quot;Enregistrer le contrat&quot;</strong></li>
        </StepList>
        <Tip>
          <strong>Astuce :</strong> Le badge <Badge $bg="#E6F8EB" $color="#10B981">Contrat OK</Badge> indique
          qu&apos;un contrat est deja associe. Le badge <Badge $bg="#FFDC99" $color="#92400E">Sans contrat</Badge> signale
          qu&apos;il reste a faire.
        </Tip>

        <SubTitle>4. Checkbox &quot;Ajout GDC&quot;</SubTitle>
        <P>
          La colonne checkbox a droite du tableau permet de marquer un BDC pour
          l&apos;ajout automatique au GDC. Cochez/decochez pour basculer.
        </P>

        <SubTitle>5. Ressources du BDC</SubTitle>
        <P>
          Sous le tableau principal, la section &quot;Ressources&quot; affiche les lignes de deploiement
          (produits) du BDC selectionne. Pour chaque ressource, vous pouvez :
        </P>
        <BulletList>
          <li><strong>+ GDC</strong> : Ajouter l&apos;article correspondant dans le contrat Sophia</li>
          <li><strong>Suppr.</strong> : Supprimer un article deja cree dans Sophia</li>
        </BulletList>
      </Section>
    </>
  );
}

function Facturation() {
  return (
    <>
      <Section>
        <Title>A Facturer</Title>
        <P>
          Cet ecran est le coeur de l&apos;activite de facturation. Il affiche toutes les ressources
          (lignes DPL) qui ont une date CMES ou une date de facturation anticipee, et permet
          de creer les articles correspondants dans Sophia.
        </P>

        <SubTitle>1. Onglets</SubTitle>
        <Table>
          <thead>
            <tr>
              <th>Onglet</th>
              <th>Contenu</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>CMES</strong></td>
              <td>Ressources avec une date J2 CMES (Compte-rendu de Mise En Service)</td>
            </tr>
            <tr>
              <td><strong>Fac. Anticipees</strong></td>
              <td>Ressources avec une date de facturation anticipee</td>
            </tr>
          </tbody>
        </Table>

        <SubTitle>2. Filtres</SubTitle>
        <Table>
          <thead>
            <tr>
              <th>Filtre</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tous</td>
              <td>Toutes les ressources de l&apos;onglet</td>
            </tr>
            <tr>
              <td>A facturer</td>
              <td>Ressources ni ACTIVATED ni masquees (travail restant)</td>
            </tr>
            <tr>
              <td>Masquees</td>
              <td>Ressources masquees manuellement</td>
            </tr>
            <tr>
              <td>Dans GDC</td>
              <td>Ressources deja ajoutees dans un GDC Sophia</td>
            </tr>
          </tbody>
        </Table>

        <SubTitle>3. Les 3 regles de validation (C | S | P)</SubTitle>
        <P>
          Chaque ligne affiche 3 indicateurs colores representant les conditions requises
          avant de pouvoir ajouter un article dans Sophia :
        </P>
        <Table>
          <thead>
            <tr>
              <th>Indicateur</th>
              <th>Signification</th>
              <th>Condition</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><Dot $color="#10B981" /> <strong>C</strong> (Contrat)</td>
              <td>Contrat Sophia associe</td>
              <td>Le BDC parent a un <Kbd>gdc_contractId</Kbd> et un <Kbd>gdc_invoicedEntityId</Kbd></td>
            </tr>
            <tr>
              <td><Dot $color="#10B981" /> <strong>S</strong> (Site)</td>
              <td>Site Sophia selectionne</td>
              <td>La ressource a un <Kbd>id_site_sophia_go</Kbd></td>
            </tr>
            <tr>
              <td><Dot $color="#10B981" /> <strong>P</strong> (Produit)</td>
              <td>Produit Sophia configure</td>
              <td>Les champs <Kbd>gdc_serviceId</Kbd>, <Kbd>gdc_categoryId</Kbd>, <Kbd>gdc_catalogRef</Kbd> et <Kbd>gdc_productName</Kbd> sont remplis</td>
            </tr>
          </tbody>
        </Table>
        <P>
          Un indicateur <Dot $color="#10B981" /> vert signifie &quot;OK&quot;, <Dot $color="#EF4444" /> rouge signifie &quot;manquant&quot;, <Dot $color="#F59E0B" /> orange signifie &quot;partiel&quot;.
        </P>
        <Warning>
          <strong>Important :</strong> Les boutons d&apos;action (GDC, Valider) ne sont actifs que
          lorsque les 3 indicateurs sont verts.
        </Warning>

        <SubTitle>4. Actions par ligne</SubTitle>
        <Table>
          <thead>
            <tr>
              <th>Bouton</th>
              <th>Action</th>
              <th>Condition</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><Badge $bg="#FFDC99" $color="#92400E">GDC</Badge></td>
              <td>Ajoute l&apos;article dans Sophia avec le statut INPROGRESS</td>
              <td>Pas d&apos;article existant + 3 regles validees</td>
            </tr>
            <tr>
              <td><Badge $bg="#E6F8EB" $color="#10B981">Valider</Badge></td>
              <td>Active l&apos;article (statut ACTIVATED)</td>
              <td>Article inexistant ou INPROGRESS + 3 regles validees</td>
            </tr>
            <tr>
              <td><Badge $bg="#FFDDDD" $color="#EF4444">Suppr</Badge></td>
              <td>Supprime l&apos;article de Sophia</td>
              <td>Article existant dans Sophia</td>
            </tr>
            <tr>
              <td>Checkbox &quot;Masquer&quot;</td>
              <td>Cache la ligne du filtre &quot;A facturer&quot;</td>
              <td>Toujours disponible</td>
            </tr>
          </tbody>
        </Table>

        <SubTitle>5. Selectionner un site</SubTitle>
        <StepList>
          <li>Cliquez sur la cellule &quot;Site&quot; d&apos;une ligne (le texte ou le point rouge)</li>
          <li>Une fenetre de recherche de sites Sophia s&apos;ouvre</li>
          <li>Tapez le nom du site ou une adresse</li>
          <li>Selectionnez le site dans les resultats</li>
          <li>Le site est automatiquement associe a la ressource</li>
        </StepList>

        <SubTitle>6. Modifier le code produit ou le nom</SubTitle>
        <P>
          Les colonnes &quot;Code produit&quot; et &quot;Nom produit&quot; sont editables directement
          dans le tableau. Cliquez sur la valeur pour passer en mode edition.
        </P>
        <BulletList>
          <li><Kbd>Entree</Kbd> pour valider la modification</li>
          <li><Kbd>Echap</Kbd> pour annuler</li>
          <li>Cliquez ailleurs pour valider</li>
        </BulletList>
        <Tip>
          <strong>Astuce :</strong> Quand vous modifiez le code produit, l&apos;application recherche
          automatiquement le produit correspondant dans le catalogue Sophia et remplit les champs
          techniques (serviceId, categoryId, catalogRef).
        </Tip>

        <SubTitle>7. Lignes grisees</SubTitle>
        <P>
          Les lignes avec un fond grise correspondent a des BDC annules. Elles restent
          visibles pour reference mais ne doivent normalement pas etre facturees.
        </P>
      </Section>
    </>
  );
}

function Statuts() {
  return (
    <>
      <Section>
        <Title>Statuts et regles metier</Title>

        <SubTitle>Statuts des articles Sophia</SubTitle>
        <Table>
          <thead>
            <tr>
              <th>Statut</th>
              <th>Badge</th>
              <th>Signification</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Aucun</td>
              <td><Badge $bg="#F2F4F5" $color="#333F44">-</Badge></td>
              <td>Article non encore cree dans Sophia</td>
            </tr>
            <tr>
              <td>INPROGRESS</td>
              <td><Badge $bg="#CCE0FF" $color="#3B82F6">INPROGRESS</Badge></td>
              <td>Article cree, en attente de validation</td>
            </tr>
            <tr>
              <td>ACTIVATED</td>
              <td><Badge $bg="#E6F8EB" $color="#10B981">ACTIVATED</Badge></td>
              <td>Article valide et actif dans Sophia</td>
            </tr>
          </tbody>
        </Table>

        <SubTitle>Regles de validation (3 niveaux)</SubTitle>
        <P>
          Avant d&apos;ajouter un article dans Sophia, 3 conditions doivent etre remplies.
          Ces conditions sont representees par les indicateurs C | S | P dans le tableau.
        </P>

        <StepList>
          <li>
            <strong>Regle 1 - Contrat (C) :</strong> Le BDC doit etre associe a un contrat Sophia
            avec un identifiant de contrat et une entite de facturation. Cela se fait sur la page
            &quot;Validation BDC&quot;.
          </li>
          <li>
            <strong>Regle 2 - Site (S) :</strong> La ressource doit avoir un site Sophia.
            Le site doit appartenir a l&apos;organisation du contrat. Selection via la modale de recherche.
          </li>
          <li>
            <strong>Regle 3 - Produit (P) :</strong> Les champs techniques du produit (service, categorie,
            reference catalogue, nom produit) doivent etre remplis. La recherche par code produit
            remplit ces champs automatiquement.
          </li>
        </StepList>

        <SubTitle>Transformation des codes produit</SubTitle>
        <P>
          Les codes produit sont normalises automatiquement lors de la recherche Sophia.
          Par exemple, un code se terminant par &quot;F/M&quot; est transforme en &quot;M&quot;.
          Le code original et le code transforme sont tous deux affiches dans les resultats.
        </P>

        <SubTitle>Regles speciales sur les montants</SubTitle>
        <BulletList>
          <li>Si le montant (ABO) ou le SAF est a 0, il n&apos;est pas envoye a Sophia (sauf pour les codes se terminant par -M ou -Z)</li>
          <li>La quantite par defaut est 1 si non specifiee</li>
        </BulletList>

        <SubTitle>BDC annules</SubTitle>
        <P>
          Les BDC annules sont detectes automatiquement via la vue <Kbd>vue_bdc_annules</Kbd>.
          Leurs lignes apparaissent grisees dans le tableau de facturation.
          Les donnees sont mises a jour toutes les 60 secondes.
        </P>
      </Section>
    </>
  );
}

function FAQ() {
  return (
    <>
      <Section>
        <Title>Questions frequentes</Title>

        <SubTitle>Je ne trouve pas le contrat Sophia dans la recherche</SubTitle>
        <P>
          La recherche necessite au minimum 2 caracteres. Essayez avec le numero de contrat,
          le nom du client ou une reference interne. Verifiez que le contrat existe bien
          dans Sophia Go V4 (lien dans la barre superieure).
        </P>

        <SubTitle>Les boutons GDC/Valider sont grises</SubTitle>
        <P>
          Les boutons ne s&apos;activent que lorsque les 3 regles de validation sont remplies (C, S, P).
          Survolez les indicateurs colores pour voir le detail de ce qui manque.
          Verifiez successivement :
        </P>
        <StepList>
          <li>Le BDC a-t-il un contrat associe ? (page Validation BDC)</li>
          <li>La ressource a-t-elle un site Sophia ? (cliquez sur la colonne Site)</li>
          <li>Le code produit est-il renseigne et reconnu par Sophia ?</li>
        </StepList>

        <SubTitle>Comment masquer une ligne que je ne veux pas facturer ?</SubTitle>
        <P>
          Cochez la case &quot;Masquer&quot; a droite de la ligne. La ressource ne disparait pas
          mais est deplacee dans le filtre &quot;Masquees&quot;. Vous pouvez la rendre visible
          a nouveau en decochant.
        </P>

        <SubTitle>J&apos;ai ajoute un article par erreur dans Sophia</SubTitle>
        <P>
          Cliquez sur le bouton <Badge $bg="#FFDDDD" $color="#EF4444">Suppr</Badge> de la ligne
          correspondante. L&apos;article sera supprime du contrat Sophia. Vous pourrez
          ensuite le recreer avec les bonnes informations.
        </P>

        <SubTitle>Les donnees ne sont pas a jour</SubTitle>
        <P>
          Les donnees se rafraichissent automatiquement toutes les 30 secondes.
          Si vous avez fait une modification dans Sophia directement, attendez quelques
          secondes ou rechargez la page avec <Kbd>F5</Kbd>.
        </P>

        <SubTitle>Une ligne est grisee, que faire ?</SubTitle>
        <P>
          Les lignes grisees correspondent a des BDC annules. En principe, elles ne doivent
          pas etre facturees. Si l&apos;annulation est une erreur, verifiez dans OC (application source).
        </P>

        <SubTitle>Le site que je cherche n&apos;apparait pas</SubTitle>
        <P>
          La recherche de sites porte sur le nom et l&apos;adresse. Verifiez que le site existe
          dans Sophia Go (section Sites). Le site doit appartenir a l&apos;arborescence de
          l&apos;organisation du contrat.
        </P>

        <SubTitle>Que signifie l&apos;indicateur orange sur &quot;C&quot; ?</SubTitle>
        <P>
          L&apos;indicateur orange sur le Contrat signifie que le contrat est partiellement
          renseigne : l&apos;identifiant du contrat est present mais le nom de l&apos;entite
          de facturation est manquant. Retournez sur Validation BDC pour completer.
        </P>

        <SubTitle>Comment modifier le nom du produit ?</SubTitle>
        <P>
          Cliquez directement sur le nom du produit dans le tableau. Le champ devient
          editable. Tapez le nouveau nom et appuyez sur <Kbd>Entree</Kbd> pour sauvegarder.
        </P>
      </Section>
    </>
  );
}

const sections: Record<TabId, () => JSX.Element> = {
  'accueil': Accueil,
  'validation-bdc': ValidationBdc,
  'facturation': Facturation,
  'statuts': Statuts,
  'faq': FAQ,
};

export default function AidePage() {
  const [activeTab, setActiveTab] = useState<TabId>('accueil');
  const ActiveSection = sections[activeTab];

  return (
    <PageWrapper>
      <Nav>
        {tabs.map(tab => (
          <NavTab
            key={tab.id}
            $active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </NavTab>
        ))}
      </Nav>
      <ActiveSection />
      <VersionInfo>
        OC-Facturer v0.1.0 — Documentation mise a jour le 05/03/2026
      </VersionInfo>
    </PageWrapper>
  );
}
