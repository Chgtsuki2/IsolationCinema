import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { MotionConfig, motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  Ticket,
  User,
  Menu,
  X,
  LogOut,
  ArrowUpRight,
} from "lucide-react";
import { Toaster } from "react-hot-toast";
import { get, send } from "./api/axiosClient";
import {
  Session,
  ProtectedRoute,
  AdminRoute,
  GuestRoute,
  Poster,
  type Row,
} from "./common";
import {
  Home,
  Movies,
  MovieDetail,
  ShowtimePicker,
  Cinemas,
  SeatSelection,
  Payment,
  BookingSuccess,
  MyTickets,
  AuthPage,
  Profile,
} from "./customer";
import { Admin } from "./admin";
import "./styles.css";
function App() {
  const [user, setUser] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Row[]>([]);
  const [bell, setBell] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState("");
  const location = useLocation();
  const nav = useNavigate();
  async function refresh() {
    if (!localStorage.getItem("cinema-token")) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await get("/api/auth/me"));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }
  function logout() {
    localStorage.removeItem("cinema-token");
    setUser(null);
    setNotifications([]);
    nav("/login");
  }
  useEffect(() => {
    void refresh();
    const expired = () => {
      setUser(null);
      setNotifications([]);
    };
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, []);
  useEffect(() => {
    setMenu(false);
    setBell(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (!user) return;
    let active = true;
    const fetch = () =>
      get<Row[]>("/api/notifications")
        .then((x) => {
          if (active) setNotifications(x);
        })
        .catch(() => undefined);
    void fetch();
    const t = setInterval(fetch, 10000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [user?.id]);
  const isAdmin = location.pathname.startsWith("/admin");
  return (
    <Session.Provider value={{ user, loading, refresh, logout }}>
      <MotionConfig reducedMotion="user">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: { borderRadius: 12, fontFamily: "inherit" },
          }}
        />
        {!isAdmin && (
          <header className="site-header">
            <div className="header-inner">
              <Link to="/" className="brand">
                <img
                  className="brand-logo"
                  src="/logo.jpg"
                  alt="Isolation Cinema"
                />
                <span>
                  ISOLATION<small>CINEMA & MORE</small>
                </span>
              </Link>
              <nav className={menu ? "main-nav open" : "main-nav"}>
                {[
                  ["/", "Trang chủ"],
                  ["/movies", "Phim"],
                  ["/showtimes", "Lịch chiếu"],
                  ["/cinemas", "Rạp phim"],
                  ["/promotions", "Khuyến mãi"],
                ].map(([url, label]) => (
                  <NavLink key={url} to={url} end>
                    {label}
                  </NavLink>
                ))}
              </nav>
              <div className="header-actions">
                <form
                  className="header-search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    nav("/movies?q=" + encodeURIComponent(search));
                  }}
                >
                  <input
                    aria-label="Tìm kiếm phim"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm phim…"
                  />
                  <button aria-label="Tìm phim" className="icon-button">
                    <Search size={18} />
                  </button>
                </form>
                {user ? (
                  <>
                    <div className="notification-wrap">
                      <button
                        className="icon-button"
                        aria-label="Thông báo"
                        aria-expanded={bell}
                        onClick={() => setBell((v) => !v)}
                      >
                        <Bell size={20} />
                        {notifications.some((n) => !n.readStatus) && (
                          <b className="unread-count">
                            {notifications.filter((n) => !n.readStatus).length}
                          </b>
                        )}
                      </button>
                      <AnimatePresence>
                        {bell && (
                          <motion.div
                            className="notification-dropdown"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                          >
                            <h3>Thông báo</h3>
                            {notifications.length ? (
                              notifications.slice(0, 10).map((n) => (
                                <button
                                  className={n.readStatus ? "read" : ""}
                                  key={n.id}
                                  onClick={async () => {
                                    await send(
                                      "/api/notifications/" + n.id + "/read",
                                      {},
                                      "put",
                                    );
                                    setNotifications((v) =>
                                      v.map((x) =>
                                        x.id === n.id
                                          ? { ...x, readStatus: true }
                                          : x,
                                      ),
                                    );
                                    nav("/my-tickets");
                                  }}
                                >
                                  <strong>{n.title}</strong>
                                  <span>{n.message}</span>
                                </button>
                              ))
                            ) : (
                              <p>Chưa có thông báo mới.</p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <Link
                      to="/my-tickets"
                      className="icon-button"
                      title="Vé của tôi"
                      aria-label="Vé của tôi"
                    >
                      <Ticket size={20} />
                    </Link>
                    <Link to="/profile" className="avatar" aria-label="Hồ sơ">
                      {user.avatarUrl ? (
                        <Poster src={user.avatarUrl} alt={user.fullName} />
                      ) : (
                        <User size={20} />
                      )}
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link to="/admin" className="admin-link">
                        Quản trị
                      </Link>
                    )}
                    <button
                      className="icon-button desktop-logout"
                      aria-label="Đăng xuất"
                      onClick={logout}
                    >
                      <LogOut size={18} />
                    </button>
                  </>
                ) : (
                  <Link className="button small" to="/login">
                    Đăng nhập
                  </Link>
                )}
                <button
                  className="icon-button menu-toggle"
                  aria-label="Menu"
                  onClick={() => setMenu((v) => !v)}
                >
                  {menu ? <X /> : <Menu />}
                </button>
              </div>
            </div>
          </header>
        )}
        <main className={isAdmin ? "" : "page-container"}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/movies/:id" element={<MovieDetail />} />
              <Route
                path="/showtimes"
                element={
                  <section>
                    <span className="eyebrow">LÊN LỊCH CHO BUỔI HẸN</span>
                    <h1>Lịch chiếu phim</h1>
                    <ShowtimePicker />
                  </section>
                }
              />
              <Route path="/cinemas" element={<Cinemas />} />
              <Route
                path="/promotions"
                element={
                  <section className="promotions-page">
                    <span className="eyebrow">THÊM NIỀM VUI, THÊM ƯU ĐÃI</span>
                    <h1>Khuyến mãi tại Isolation</h1>
                    <div className="panel">
                      <h2>Hẹn bạn ở ưu đãi tiếp theo</h2>
                      <p>
                        Hiện chưa có chương trình khuyến mãi đang áp dụng. Giá
                        vé chính thức được hiển thị khi chọn suất chiếu và ghế.
                      </p>
                      <Link to="/movies" className="button">
                        Khám phá phim <ArrowUpRight size={18} />
                      </Link>
                    </div>
                  </section>
                }
              />
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <AuthPage />
                  </GuestRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <GuestRoute>
                    <AuthPage register />
                  </GuestRoute>
                }
              />
              <Route
                path="/booking/:id"
                element={
                  <ProtectedRoute>
                    <SeatSelection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment/:bookingId"
                element={
                  <ProtectedRoute>
                    <Payment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking-success/:bookingId"
                element={
                  <ProtectedRoute>
                    <BookingSuccess />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-tickets"
                element={
                  <ProtectedRoute>
                    <MyTickets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/:resource"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />
              <Route
                path="/unauthorized"
                element={
                  <section className="empty">
                    <h1>Không có quyền truy cập</h1>
                    <Link className="button" to="/">
                      Về trang chủ
                    </Link>
                  </section>
                }
              />
              <Route
                path="*"
                element={
                  <section className="empty">
                    <h1>Không tìm thấy trang</h1>
                    <Link className="button" to="/">
                      Về trang chủ
                    </Link>
                  </section>
                }
              />
            </Routes>
          </motion.div>
        </main>
        {!isAdmin && (
          <footer className="site-footer">
            <div className="footer-inner">
              <div>
                <Link to="/" className="brand">
                  <img
                    className="brand-logo"
                    src="/logo.jpg"
                    alt="Lumière Cinema"
                  />
                  <span>
                    ISOLATION<small>CINEMA & MORE</small>
                  </span>
                </Link>
                <p>Điện ảnh kết nối những cảm xúc.</p>
              </div>
              <div>
                <h4>Khám phá</h4>
                <Link to="/movies">Phim đang chiếu</Link>
                <Link to="/showtimes">Lịch chiếu</Link>
                <Link to="/cinemas">Hệ thống rạp</Link>
              </div>
              <div>
                <h4>Đồng hành cùng bạn</h4>
                <Link to="/my-tickets">Vé của tôi</Link>
                <Link to="/profile">Tài khoản</Link>
                <Link to="/promotions">Khuyến mãi</Link>
              </div>
            </div>
            <div className="footer-bottom">
              © {new Date().getFullYear()} Isolation Cinema{" "}
              <span>Đồ án Phần mềm hướng dịch vụ · Thanh toán qua payOS</span>
            </div>
          </footer>
        )}
      </MotionConfig>
    </Session.Provider>
  );
}
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
