import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useMemo, useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { getEcheancesDuMois, getNomMois, getJoursRestants, type EcheanceFiscale } from "@/lib/services/calendrier-fiscal";
import { entitesApi, Entite } from "@/lib/api/entites";
import { dossiersApi, DashboardKpis } from "@/lib/api/dossiers";
import { iaInsightsApi, Insight } from "@/lib/api/ia-insights";

type Props = {
  favoritesCount?: number;
};

const COULEUR_BLEU_MARQUE = "#0F2A42";
const COULEUR_OR_MARQUE = "#D4A843";

function getGreeting(t: (key: string) => string) {
  const h = new Date().getHours();
  if (h < 12) return t("dashboard.greeting.morning");
  if (h < 18) return t("dashboard.greeting.afternoon");
  return t("dashboard.greeting.evening");
}

function formatDateLongue(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function HomeCards({ favoritesCount: _fc }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [entites, setEntites] = useState<Entite[]>([]);
  const [loadingEntites, setLoadingEntites] = useState(true);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    entitesApi.list({ limit: 200, actif: true })
      .then(r => setEntites(r.items))
      .catch(() => setEntites([]))
      .finally(() => setLoadingEntites(false));
    dossiersApi.getKpis()
      .then(setKpis)
      .catch(() => setKpis(null));
    iaInsightsApi.get()
      .then(r => setInsights(r.insights))
      .catch(() => setInsights([]));
  }, []);

  const cardBase = {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  };

  const now = new Date();
  const moisActuel = now.getMonth();
  const jourActuel = now.getDate();
  const nomMois = getNomMois(moisActuel);

  const prochainesEcheances = useMemo(() => {
    return getEcheancesDuMois(moisActuel)
      .filter((e) => e.jour >= jourActuel)
      .slice(0, 5);
  }, [moisActuel, jourActuel]);

  const prochaineEcheance = prochainesEcheances[0];
  const joursAvantProchaine = prochaineEcheance ? getJoursRestants(prochaineEcheance.jour, moisActuel) : null;

  // KPIs utilisateur — pour la v0 squelette, on derive ce qu'on peut des entites.
  // Les autres KPIs (simulations, economies, retards) attendent les blocs 2.x.
  const totalClients = entites.length;
  const nbClientsSelf = entites.filter(e => e.isClientSelf).length;
  const nbClientsCabinet = totalClients - nbClientsSelf;
  const isCabinet = nbClientsCabinet > 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ alignItems: "center", paddingBottom: 40 }}
    >
      <View style={{ width: "100%", maxWidth: 880, padding: 16 }}>
      {/* === Greeting + date === */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 22, color: colors.text }}>
          {getGreeting(t)} 👋
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
          {formatDateLongue()} · Édition fiscale 2026
        </Text>
      </View>

      {/* === Bandeau "Prochaine échéance" === */}
      {prochaineEcheance && (
        <TouchableOpacity
          onPress={() => router.push("/(app)/calendrier" as Href)}
          style={{
            backgroundColor: COULEUR_BLEU_MARQUE,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            <Ionicons name="alarm-outline" size={20} color={COULEUR_OR_MARQUE} style={{ marginRight: 8 }} />
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#cbd5e1", letterSpacing: 0.5, textTransform: "uppercase" }}>
              Prochaine échéance
            </Text>
          </View>
          <Text style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 20, color: "#fff", marginBottom: 2 }}>
            {prochaineEcheance.label}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: "#cbd5e1", marginBottom: 12 }}>
            {prochaineEcheance.jour} {nomMois} · dans {joursAvantProchaine} jour{joursAvantProchaine && joursAvantProchaine > 1 ? "s" : ""}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#94a3b8" }}>
              {totalClients > 0
                ? `${totalClients} entité${totalClients > 1 ? "s" : ""} concernée${totalClients > 1 ? "s" : ""}`
                : "Configurez vos entités pour suivre les dossiers"}
            </Text>
            <Text style={{ fontFamily: fonts.semiBold, fontSize: 13, color: COULEUR_OR_MARQUE }}>
              Voir le calendrier →
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* === Actions rapides === */}
      <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: colors.textSecondary, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 }}>
        Action rapide
      </Text>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
        <ActionButton
          icon="play-circle-outline"
          label="Lancer une simulation"
          onPress={() => router.push("/(app)/simulateur" as Href)}
          colors={colors}
          primary
        />
        <ActionButton
          icon="add-circle-outline"
          label={isCabinet ? "Nouveau client" : "Nouvelle entité"}
          onPress={() => router.push("/(app)/entites" as Href)}
          colors={colors}
        />
      </View>

      {/* === KPIs utilisateur === */}
      <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: colors.textSecondary, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 }}>
        Mon activité fiscale · {now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 22 }}>
        <KpiCard
          label={isCabinet ? "Clients suivis" : "Mes entités"}
          value={kpis ? String(kpis.totalClients > 0 ? kpis.totalClients : totalClients) : (loadingEntites ? "…" : String(totalClients))}
          hint={isCabinet ? "Profils fiscaux" : "Profils déclarés"}
          color={COULEUR_BLEU_MARQUE}
          colors={colors}
        />
        <KpiCard
          label="Obligations du mois"
          value={kpis ? String(kpis.obligationsDuMois) : "…"}
          hint={kpis ? `${kpis.obligationsDeposeesDuMois} déposées` : "À calculer"}
          color={COULEUR_OR_MARQUE}
          colors={colors}
        />
        <KpiCard
          label="En retard"
          value={kpis ? String(kpis.obligationsEnRetard) : "…"}
          hint={kpis && kpis.obligationsEnRetard === 0 ? "Aucun retard" : "À traiter"}
          color={kpis && kpis.obligationsEnRetard > 0 ? "#ef4444" : COULEUR_BLEU_MARQUE}
          colors={colors}
        />
        <KpiCard
          label="Complétion"
          value={kpis ? `${kpis.completionPct}%` : "…"}
          hint={kpis ? "Obligations déposées" : "À calculer"}
          color={COULEUR_OR_MARQUE}
          colors={colors}
        />
      </View>

      {/* === Liste échéances détaillée === */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.text }}>
          Échéances de {nomMois}
        </Text>
        <TouchableOpacity onPress={() => router.push("/(app)/calendrier" as Href)}>
          <Text style={{ fontFamily: fonts.semiBold, fontSize: 13, color: colors.primary }}>
            Voir tout →
          </Text>
        </TouchableOpacity>
      </View>
      {prochainesEcheances.length === 0 ? (
        <View style={{ ...cardBase, padding: 20, alignItems: "center", marginBottom: 22 }}>
          <Ionicons name="calendar-clear-outline" size={32} color={colors.textSecondary} />
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 8 }}>
            Aucune échéance restante ce mois-ci
          </Text>
        </View>
      ) : (
        <View style={{ marginBottom: 22 }}>
          {prochainesEcheances.map((e: EcheanceFiscale, i: number) => {
            const joursRestants = getJoursRestants(e.jour, moisActuel);
            const urgent = joursRestants <= 3;
            return (
              <View
                key={`${e.jour}-${e.label}`}
                style={{
                  ...cardBase,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  marginBottom: i < prochainesEcheances.length - 1 ? 8 : 0,
                  borderLeftWidth: 4,
                  borderLeftColor: urgent ? "#ef4444" : COULEUR_OR_MARQUE,
                }}
              >
                <View style={{ width: 44, alignItems: "center" }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.text }}>{e.jour}</Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary, textTransform: "uppercase" }}>
                    {nomMois.slice(0, 3)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: colors.text }} numberOfLines={2}>
                    {e.label}
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                    Dans {joursRestants} jour{joursRestants > 1 ? "s" : ""}
                  </Text>
                </View>
                {urgent && (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "#ef4444" }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 10, color: "#fff" }}>URGENT</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* === IA Insights (Bloc 5.1 — generes par Claude) === */}
      {insights.length === 0 ? (
        <View style={{ ...cardBase, padding: 16, marginBottom: 16, backgroundColor: `${COULEUR_OR_MARQUE}12`, borderColor: `${COULEUR_OR_MARQUE}40` }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Ionicons name="bulb-outline" size={18} color={COULEUR_OR_MARQUE} style={{ marginRight: 6 }} />
            <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: COULEUR_BLEU_MARQUE }}>
              Suggestions IA
            </Text>
          </View>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
            {totalClients === 0
              ? "Créez vos entités fiscales pour activer les suggestions personnalisées."
              : "Aucune suggestion en ce moment. Le moteur analyse vos dossiers en arrière-plan et reviendra avec des conseils dès qu'il en détecte."}
          </Text>
        </View>
      ) : (
        <View style={{ marginBottom: 16, gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <Ionicons name="sparkles-outline" size={16} color={COULEUR_OR_MARQUE} style={{ marginRight: 6 }} />
            <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: COULEUR_BLEU_MARQUE, letterSpacing: 0.4, textTransform: "uppercase" }}>
              Suggestions IA · {insights.length}
            </Text>
          </View>
          {insights.map((ins, i) => (
            <View
              key={i}
              style={{
                ...cardBase,
                padding: 14,
                backgroundColor: ins.type === "anomalie" ? "#fef2f2" : ins.type === "optimisation" ? `${COULEUR_OR_MARQUE}12` : ins.type === "echeance" ? "#fff7ed" : `${COULEUR_BLEU_MARQUE}08`,
                borderLeftWidth: 4,
                borderLeftColor: ins.type === "anomalie" ? "#ef4444" : ins.type === "optimisation" ? COULEUR_OR_MARQUE : ins.type === "echeance" ? "#f97316" : COULEUR_BLEU_MARQUE,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <Ionicons
                  name={ins.type === "anomalie" ? "warning-outline" : ins.type === "optimisation" ? "trending-up-outline" : ins.type === "echeance" ? "time-outline" : "information-circle-outline"}
                  size={14}
                  color={ins.type === "anomalie" ? "#ef4444" : ins.type === "optimisation" ? COULEUR_OR_MARQUE : ins.type === "echeance" ? "#f97316" : COULEUR_BLEU_MARQUE}
                />
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.text, flex: 1 }} numberOfLines={2}>
                  {ins.titre}
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, lineHeight: 17 }}>
                {ins.description}
              </Text>
              {ins.economiePotentielleFcfa && ins.economiePotentielleFcfa > 0 && (
                <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: COULEUR_OR_MARQUE, marginTop: 6 }}>
                  Économie potentielle : ≈ {ins.economiePotentielleFcfa.toLocaleString("fr-FR")} FCFA
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* === Activité récente (placeholder) === */}
      <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.text, marginBottom: 10 }}>
        Activité récente
      </Text>
      <View style={{ ...cardBase, padding: 18, alignItems: "center" }}>
        <Ionicons name="time-outline" size={28} color={colors.textSecondary} />
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 8, textAlign: "center" }}>
          Aucune activité récente.{"\n"}
          Vos simulations et calculs apparaîtront ici.
        </Text>
      </View>
      </View>
    </ScrollView>
  );
}

function ActionButton({ icon, label, onPress, colors, primary }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; colors: ReturnType<typeof useTheme>["colors"]; primary?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: primary ? COULEUR_OR_MARQUE : colors.card,
        borderWidth: 1,
        borderColor: primary ? COULEUR_OR_MARQUE : colors.border,
        paddingVertical: 14,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Ionicons name={icon} size={20} color={primary ? COULEUR_BLEU_MARQUE : colors.primary} />
      <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 13, color: primary ? COULEUR_BLEU_MARQUE : colors.text, flex: 1 }} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function KpiCard({ label, value, hint, color, colors }: { label: string; value: string; hint?: string; color: string; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 150,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderTopWidth: 3,
        borderTopColor: color,
        padding: 12,
      }}
    >
      <Text style={{ fontFamily: fonts.bold, fontSize: 22, color, marginBottom: 4 }}>
        {value}
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.text, fontWeight: fontWeights.semiBold }}>
        {label}
      </Text>
      {hint && (
        <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: colors.textSecondary, marginTop: 4 }}>
          {hint}
        </Text>
      )}
    </View>
  );
}
