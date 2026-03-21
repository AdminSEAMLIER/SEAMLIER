import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart2,
  Euro,
  Users,
  RefreshCw,
  TrendingUp,
  ChevronLeft,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface FullStats {
  monthlyRevenue: number;
  averageOrderValue: number;
  totalClients: number;
  recurringClientRate: number;
  revenueByMonth: { month: string; total: number }[];
  clothingTypes: { name: string; value: number }[];
}

const PIE_COLORS = [
  "#722F37",
  "#a85060",
  "#c47c85",
  "#d4a0a6",
  "#e8c8cc",
  "#b0444f",
  "#8c3a43",
];

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-[#722F37]",
  bg = "bg-[#722F37]/10",
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  color?: string;
  bg?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        <p className="text-[#722F37] font-bold">{fmt(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm">
        <p className="font-semibold text-gray-700">{payload[0].name}</p>
        <p className="text-[#722F37]">{payload[0].value} projet{payload[0].value > 1 ? "s" : ""}</p>
      </div>
    );
  }
  return null;
};

export default function ProStatistiques() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<FullStats>({
    queryKey: ["/api/tailor/stats-full"],
    queryFn: async () => {
      const res = await fetch("/api/tailor/stats-full", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    staleTime: 60_000,
  });

  const hasClothingData = stats && stats.clothingTypes.length > 0;
  const hasRevenueData = stats && stats.revenueByMonth.some((m) => m.total > 0);

  return (
    <div className="min-h-screen pb-24 bg-[#faf9f8]">
      {/* Header */}
      <div className="bg-[#722F37] text-white px-4 lg:px-8 pt-6 pb-10">
        <div className="max-w-3xl mx-auto">
          <Link href="/dashboard-pro">
            <button className="flex items-center gap-1.5 text-white/70 text-sm mb-4 hover:text-white transition-colors">
              <ChevronLeft className="h-4 w-4" /> Tableau de bord
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-medium">Statistiques</h1>
              <p className="text-white/70 text-sm mt-0.5">
                {user?.firstName ? `Activité de ${user.firstName}` : "Votre activité"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 lg:px-8 -mt-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 text-[#722F37] animate-spin" />
          </div>
        ) : stats ? (
          <>
            {/* 4 métriques */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <StatCard
                icon={Euro}
                label="CA du mois en cours"
                value={fmt(stats.monthlyRevenue)}
                sub="Projets complétés ce mois"
                color="text-[#722F37]"
                bg="bg-[#722F37]/10"
              />
              <StatCard
                icon={ShoppingBag}
                label="Panier moyen"
                value={stats.averageOrderValue > 0 ? fmt(stats.averageOrderValue) : "—"}
                sub="Tous projets complétés"
                color="text-emerald-700"
                bg="bg-emerald-50"
              />
              <StatCard
                icon={Users}
                label="Clients au total"
                value={String(stats.totalClients)}
                sub="Clients distincts"
                color="text-blue-700"
                bg="bg-blue-50"
              />
              <StatCard
                icon={RefreshCw}
                label="Taux de fidélité"
                value={`${stats.recurringClientRate}%`}
                sub="Clients avec 2+ projets"
                color="text-violet-700"
                bg="bg-violet-50"
              />
            </div>

            {/* Graphique barres : CA 6 derniers mois */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-[#722F37]" />
                <h2 className="font-semibold text-gray-900 text-sm">
                  Évolution du CA — 6 derniers mois
                </h2>
              </div>
              {hasRevenueData ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={stats.revenueByMonth}
                    margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `${v}€`}
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#f9f4f5" }} />
                    <Bar
                      dataKey="total"
                      fill="#722F37"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex flex-col items-center justify-center">
                  <TrendingUp className="h-10 w-10 text-gray-200 mb-3" />
                  <p className="text-gray-400 text-sm">Aucune donnée de CA sur cette période</p>
                </div>
              )}
            </div>

            {/* Graphique camembert : types de vêtements */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="h-5 w-5 text-[#722F37]" />
                <h2 className="font-semibold text-gray-900 text-sm">
                  Répartition des vêtements confectionnés
                </h2>
              </div>
              {hasClothingData ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={stats.clothingTypes}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {stats.clothingTypes.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: 12, color: "#6b7280" }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex flex-col items-center justify-center">
                  <ShoppingBag className="h-10 w-10 text-gray-200 mb-3" />
                  <p className="text-gray-400 text-sm">
                    Aucune donnée — renseignez le type de vêtement sur vos projets
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-20 text-center text-gray-400 text-sm">
            Impossible de charger les statistiques.
          </div>
        )}
      </div>
    </div>
  );
}
