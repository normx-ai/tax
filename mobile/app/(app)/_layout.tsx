import { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { Redirect, Stack, usePathname, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/store/auth";
import { useFavoritesStore } from "@/lib/store/favorites";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { useOfflineSync } from "@/lib/hooks/useOfflineSync";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";
// useSessionHeartbeat supprime — Keycloak gere les sessions
import { useAntiCopy } from "@/lib/hooks/useAntiCopy";
import Sidebar from "@/components/Sidebar";
import { useActiveCode } from "@/lib/context/ActiveCodeContext";
import SessionExpiredModal from "@/components/SessionExpiredModal";
import PaywallScreen from "@/components/paywall/PaywallScreen";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileTabBar, { type TabKey } from "@/components/mobile/MobileTabBar";
import SearchOverlay from "@/components/mobile/SearchOverlay";
import { api } from "@/lib/api/client";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { useResponsive } from "@/lib/hooks/useResponsive";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import FloatingCalculator from "@/components/simulateur/FloatingCalculator";
import NotificationBell from "@/components/mobile/NotificationBell";
import { ActiveCodeProvider } from "@/lib/context/ActiveCodeContext";
import TabsBar, { type TabItem } from "@/components/TabsBar";

function getInitials(prenom?: string, nom?: string) {
  return ((prenom?.[0] || "") + (nom?.[0] || "")).toUpperCase() || "U";
}

const PAGE_TITLES: Record<string, string> = {
  "/plus": "plus.title",
  "/profil": "profil.title",
  "/parametres": "settings.title",
  "/chat": "chat.title",
  "/audit-facture": "auditFacture.title",
  "/code": "code.title",
  "/simulateur": "simulateur.title",
  "/simulateur/its": "simulateur.its.title",
  "/simulateur/is": "simulateur.is.title",
  "/simulateur/patente": "simulateur.patente.title",
  "/simulateur/solde-liquidation": "simulateur.solde.title",
  "/simulateur/ircm": "simulateur.ircm.title",
  "/simulateur/irf-loyers": "simulateur.irfLoyers.title",
  "/simulateur/taxe-immobiliere": "simulateur.taxeImmo.title",
  "/simulateur/iba": "simulateur.iba.title",
  "/simulateur/tva": "simulateur.tva.title",
  "/simulateur/igf": "simulateur.igf.title",
  "/simulateur/enregistrement": "simulateur.enreg.title",
  "/simulateur/cession-parts": "simulateur.cessionParts.title",
  "/simulateur/contribution-fonciere": "simulateur.foncier.title",
  "/simulateur/paie": "simulateur.paie.title",
  "/simulateur/retenue-source": "simulateur.rts.title",
  "/calendrier": "calendrier.title",
  "/abonnement": "settings.managementSubscription",
  "/organisation": "settings.managementOrganization",
  "/analytics": "settings.managementAnalytics",
  "/audit": "settings.managementAudit",
  "/permissions": "settings.managementPermissions",
  "/admin": "settings.managementAdmin",
  "/securite": "settings.twoFactor",
  "/factures": "factures.title",
};

const PAGE_PARENTS: Record<string, { path: string; titleKey: string }> = {
  "/profil": { path: "/plus", titleKey: "plus.title" },
  "/parametres": { path: "/plus", titleKey: "plus.title" },
  "/securite": { path: "/plus", titleKey: "plus.title" },
  "/abonnement": { path: "/plus", titleKey: "plus.title" },
  "/organisation": { path: "/plus", titleKey: "plus.title" },
  "/analytics": { path: "/plus", titleKey: "plus.title" },
  "/audit": { path: "/plus", titleKey: "plus.title" },
  "/permissions": { path: "/plus", titleKey: "plus.title" },
  "/admin": { path: "/plus", titleKey: "plus.title" },
  "/factures": { path: "/plus", titleKey: "plus.title" },
  "/simulateur/its": { path: "/simulateur", titleKey: "simulateur.title" },
  "/simulateur/is": { path: "/simulateur", titleKey: "simulateur.title" },
  "/simulateur/patente": { path: "/simulateur", titleKey: "simulateur.title" },
  "/simulateur/solde-liquidation": { path: "/simulateur", titleKey: "simulateur.title" },
  "/simulateur/ircm": { path: "/simulateur", titleKey: "simulateur.title" },
  "/simulateur/irf-loyers": { path: "/simulateur", titleKey: "simulateur.title" },
  "/simulateur/taxe-immobiliere": { path: "/simulateur", titleKey: "simulateur.title" },
  "/simulateur/iba": { path: "/simulateur", titleKey: "simulateur.title" },
  "/simulateur/tva": { path: "/simulateur", titleKey: "simulateur.title" },
  "/simulateur/igf": { path: "/simulateur", titleKey: "simulateur.title" },
  "/simulateur/enregistrement": { path: "/simulateur", titleKey: "simulateur.title" },
  "/simulateur/cession-parts": { path: "/simulateur", titleKey: "simulateur.title" },
  "/simulateur/contribution-fonciere": { path: "/simulateur", titleKey: "simulateur.title" },
  "/simulateur/paie": { path: "/simulateur", titleKey: "simulateur.title" },
  "/simulateur/retenue-source": { path: "/simulateur", titleKey: "simulateur.title" },
};

export default function AppLayout() {
  return (
    <ActiveCodeProvider>
      <AppLayoutInner />
    </ActiveCodeProvider>
  );
}

function AppLayoutInner() {
  const { mode, toggleTheme, colors } = useTheme();
  const { t, i18n } = useTranslation();
  useOfflineSync();
  usePushNotifications();
  // useSessionHeartbeat() — supprime, Keycloak gere les sessions
  useAntiCopy();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loggedOut = useAuthStore((s) => s.loggedOut);
  const user = useAuthStore((s) => s.user);
  const loadFavorites = useFavoritesStore((s) => s.loadFavorites);
  const favoritesLoaded = useFavoritesStore((s) => s.loaded);
  const isOnline = useOnlineStatus();
  const pathname = usePathname();
  const { isMobile } = useResponsive();
  const { activeCode, setActiveCode } = useActiveCode();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  // --- Onglets style Normx ---
  type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];
  const PAGE_ICONS: Record<string, IoniconsName> = {
    "/": "home-outline", "/code": "book-outline", "/simulateur": "calculator-outline",
    "/calendrier": "calendar-outline", "/chat": "chatbubbles-outline", "/audit-facture": "scan-outline",
    "/profil": "person-outline", "/parametres": "settings-outline", "/plus": "ellipsis-horizontal",
  };
  const [openTabs, setOpenTabs] = useState<TabItem[]>([
    { id: "/", label: "Accueil", icon: "home-outline", route: "/(app)", closable: false },
  ]);
  const [activeTabId, setActiveTabId] = useState("/");

  useEffect(() => {
    const tabId = pathname === "/(app)" ? "/" : pathname;
    setActiveTabId(tabId);
    setOpenTabs((prev) => {
      if (prev.some((t) => t.id === tabId)) return prev;
      const titleKey = PAGE_TITLES[pathname];
      const label = titleKey ? t(titleKey) : pathname.split("/").pop() || "";
      const icon = Object.entries(PAGE_ICONS).find(([k]) => pathname.startsWith(k) && k !== "/")?.[1] || "document-outline";
      return [...prev, { id: tabId, label, icon: icon as IoniconsName, route: `/(app)${pathname}`, closable: true }];
    });
  }, [pathname]);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      api.get("/subscription/quota")
        .then((res) => setSubStatus(res.data.status))
        .catch(() => setSubStatus(null))
        .finally(() => setSubLoading(false));
      if (!favoritesLoaded) loadFavorites();
    }
  }, [isAuthenticated]);

  const handleMobileTabPress = useCallback((tab: TabKey) => {
    if (tab === "cgi") {
      setActiveCode("cgi");
      router.push("/(app)/code" as Href);
    } else if (tab === "social") {
      setActiveCode("social");
      router.push("/(app)/code" as Href);
    } else {
      const routes: Record<string, string> = {
        home: "/(app)",
        sim: "/(app)/simulateur",
        cal: "/(app)/calendrier",
        chat: "/(app)/chat",
        plus: "/(app)/plus",
      };
      router.push(routes[tab] as Href);
    }
  }, [setActiveCode]);

  const handleMobileBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/(app)" as Href);
    }
  }, []);

  if (!isAuthenticated && !loggedOut) {
    return <Redirect href="/(auth)" />;
  }

  if (!isAuthenticated && loggedOut) {
    return null;
  }

  if (subLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 16 }}>{t("abonnement.loadingSubscription")}</Text>
      </View>
    );
  }

  if (subStatus === "EXPIRED" && user?.role !== "ADMIN") {
    return <PaywallScreen />;
  }

  const isHome = pathname === "/" || pathname === "/(app)";
  const pageTitleKey = !isHome ? PAGE_TITLES[pathname] : null;
  const parent = !isHome ? PAGE_PARENTS[pathname] : null;

  // Titre dynamique pour le breadcrumb de la page Code
  const getPageTitle = (): string => {
    if (pageTitleKey && pathname === "/code") {
      return activeCode === "social" ? "Code Social" : "Code des Impôts";
    }
    return pageTitleKey ? t(pageTitleKey) : "";
  };

  // ── Mapping route → onglet actif pour MobileTabBar ──
  const getActiveTab = (): TabKey => {
    if (pathname.startsWith("/code")) return activeCode === "social" ? "social" : "cgi";
    if (pathname.startsWith("/simulateur")) return "sim";
    if (pathname.startsWith("/calendrier")) return "cal";
    if (pathname.startsWith("/chat")) return "chat";
    if (pathname.startsWith("/plus") || pathname.startsWith("/profil") || pathname.startsWith("/parametres") || pathname.startsWith("/securite") || pathname.startsWith("/abonnement") || pathname.startsWith("/factures")) return "plus";
    return "home";
  };

  // Titre dynamique pour le header mobile
  const getMobileTitle = (): string => {
    if (isHome) return "NORMX Tax";
    if (pageTitleKey) return getPageTitle();
    return "NORMX Tax";
  };

  // Bouton retour : visible si on n'est pas sur un écran principal
  const mobileShowBack = !isHome && !(["/code", "/simulateur", "/calendrier", "/chat", "/plus"].includes(pathname));

  // ── Stack commun (partagé mobile + desktop) ──
  const stackScreens = (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === "web" ? "none" : "slide_from_right",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="code/index" />
      <Stack.Screen name="simulateur/index" />
      <Stack.Screen name="simulateur/its" />
      <Stack.Screen name="simulateur/is" />
      <Stack.Screen name="simulateur/patente" />
      <Stack.Screen name="simulateur/solde-liquidation" />
      <Stack.Screen name="simulateur/ircm" />
      <Stack.Screen name="simulateur/irf-loyers" />
      <Stack.Screen name="simulateur/taxe-immobiliere" />
      <Stack.Screen name="simulateur/iba" />
      <Stack.Screen name="simulateur/tva" />
      <Stack.Screen name="simulateur/igf" />
      <Stack.Screen name="simulateur/enregistrement" />
      <Stack.Screen name="simulateur/cession-parts" />
      <Stack.Screen name="simulateur/contribution-fonciere" />
      <Stack.Screen name="simulateur/paie" />
      <Stack.Screen name="simulateur/retenue-source" />
      <Stack.Screen name="calendrier/index" />
      <Stack.Screen name="chat/index" />
      <Stack.Screen name="abonnement/index" />
      <Stack.Screen name="admin/index" />
      <Stack.Screen name="plus/index" />
      <Stack.Screen name="profil/index" />
      <Stack.Screen name="parametres/index" />
      <Stack.Screen name="organisation/index" />
      <Stack.Screen name="securite/index" />
      <Stack.Screen name="analytics/index" />
      <Stack.Screen name="audit/index" />
      <Stack.Screen name="permissions/index" />
      <Stack.Screen name="factures/index" />
      <Stack.Screen name="factures/[id]" />
      <Stack.Screen name="audit-facture/index" />
    </Stack>
  );

  // ══════════════════════════════════════════════
  // Sur mobile : MobileHeader + Stack + MobileTabBar
  // ══════════════════════════════════════════════
  if (isMobile) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <MobileHeader
          title={getMobileTitle()}
          showBack={mobileShowBack}
          onBack={handleMobileBack}
          onSearch={() => setSearchVisible(true)}
          rightElement={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <NotificationBell />
              <TouchableOpacity onPress={toggleTheme} hitSlop={8}>
                <Ionicons name={mode === "dark" ? "moon" : "sunny"} size={18} color="#e8e6e1" />
              </TouchableOpacity>
            </View>
          }
        />
        <SearchOverlay visible={searchVisible} onClose={() => setSearchVisible(false)} />

        {/* Bannière offline */}
        {!isOnline && (
          <View style={{ backgroundColor: colors.warning, paddingHorizontal: 16, paddingVertical: 6, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="cloud-offline-outline" size={14} color={colors.userBubbleText} style={{ marginRight: 6 }} />
            <Text style={{ color: colors.userBubbleText, fontSize: 14, fontWeight: "600" }}>{t("offline.banner")}</Text>
          </View>
        )}

        {/* Contenu — vrais écrans via Stack */}
        <View style={{ flex: 1 }}>
          {stackScreens}
        </View>

        <FloatingCalculator />
        <MobileTabBar active={getActiveTab()} onTabPress={handleMobileTabPress} />
        <SessionExpiredModal />
      </View>
    );
  }

  // ══════════════════════════════════════════════
  // Sur desktop/tablet : Sidebar + Header + Stack
  // ══════════════════════════════════════════════
  return (
    <View style={{ flex: 1, flexDirection: "row" }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentRoute={pathname}
      />
      <View style={{ flex: 1 }}>
        {/* Header principal — style Normx */}
        <View style={{ backgroundColor: colors.headerBg, paddingHorizontal: 20, height: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 100 }}>
          {/* Gauche : logo + breadcrumb */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={() => router.push("/(app)")} style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.headingBlack, fontWeight: fontWeights.headingBlack, fontSize: 24, color: "#D4A843", letterSpacing: -0.5 }}>
                NORMX
              </Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 24, color: "#e8e6e1", marginLeft: 4 }}>
                Tax
              </Text>
            </TouchableOpacity>
            {!isHome && pageTitleKey && (
              <>
                {parent && (
                  <>
                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.4)" style={{ marginHorizontal: 8 }} />
                    <TouchableOpacity onPress={() => router.push(`/(app)${parent.path}` as Href)}>
                      <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: 15 }}>
                        {t(parent.titleKey)}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.4)" style={{ marginHorizontal: 8 }} />
                <Text style={{ color: "#D4A843", fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 15 }}>
                  {getPageTitle()}
                </Text>
              </>
            )}
          </View>

          {/* Droite : notif + langue + theme + user */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <NotificationBell />

            <TouchableOpacity
              onPress={() => i18n.changeLanguage(i18n.language === "fr" ? "en" : "fr")}
              style={{ padding: 6 }}
            >
              <Text style={{ color: "#e8e6e1", fontSize: 13, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>
                {i18n.language === "fr" ? "FR" : "EN"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleTheme} style={{ padding: 6 }}>
              <Ionicons name={mode === "dark" ? "moon" : "sunny"} size={18} color="#e8e6e1" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(app)/profil")}
              style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, paddingHorizontal: 10 }}
            >
              <View style={{ width: 28, height: 28, backgroundColor: "#D4A843", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#fff", fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 12 }}>
                  {getInitials(user?.prenom, user?.nom)}
                </Text>
              </View>
              <Text style={{ color: "#e8e6e1", fontFamily: fonts.regular, fontSize: 13 }}>
                {user?.prenom || "Utilisateur"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bannière offline */}
        {!isOnline && (
          <View style={{ backgroundColor: colors.warning, paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="cloud-offline-outline" size={16} color={colors.sidebarText} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.sidebarText, fontSize: 15, fontWeight: "600" }}>
              {t("offline.banner")}
            </Text>
          </View>
        )}

        {/* Contenu */}
        <View style={{ flex: 1 }}>
          {stackScreens}
        </View>

        {/* Onglets style Normx */}
        <TabsBar
          openTabs={openTabs}
          activeTab={activeTabId}
          onSelectTab={(id) => setActiveTabId(id)}
          onCloseTab={(id) => {
            setOpenTabs((prev) => {
              const next = prev.filter((t) => t.id !== id);
              if (activeTabId === id && next.length > 0) {
                const last = next[next.length - 1];
                setActiveTabId(last.id);
                router.push(last.route as Href);
              }
              return next;
            });
          }}
        />
      </View>
      <FloatingCalculator />
      <SessionExpiredModal />
    </View>
  );
}
