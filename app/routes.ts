import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/chat", "routes/chat.tsx"),
  route("/login", "routes/login.tsx"),
  route("/verify", "routes/verify.tsx"),
  route("/admin/users", "routes/admin/users.tsx"),
  route("/categorias", "routes/categorias.tsx"),
  route("/cuentas", "routes/cuentas.tsx"),
  route("/presupuestos", "routes/presupuestos.tsx"),
  route("/transacciones", "routes/transacciones.tsx"),
  route("/deseos", "routes/deseos.tsx"),
  route("/metricas", "routes/metricas.tsx"),
  route("/cuenta", "routes/cuenta.tsx"),
  route("/papelera", "routes/papelera.tsx"),
] satisfies RouteConfig;
