import { useEffect, useState } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Film,
  Tags,
  Building2,
  DoorOpen,
  Armchair,
  CalendarDays,
  Ticket,
  CreditCard,
  Users,
  Bell,
  ChartNoAxesCombined,
  LogOut,
  PanelLeftClose,
  Plus,
  Pencil,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import toast from "react-hot-toast";
import { get, send, money, errorText } from "./api/axiosClient";
import {
  useData,
  useSession,
  Poster,
  Button,
  Modal,
  Badge,
  Empty,
  Skeleton,
  ErrorBox,
  UploadField,
  labels,
  type Row,
} from "./common";
import { BookingInfo } from "./customer";
type Field = {
  key: string;
  label: string;
  type?: string;
  options?: string[];
  source?: string;
  required?: boolean;
  upload?: string;
};
const f = (
  key: string,
  label: string,
  type = "text",
  required = true,
): Field => ({ key, label, type, required });
const s = (key: string, label: string, options: string[]): Field => ({
  key,
  label,
  type: "select",
  options,
  required: true,
});
const r = (key: string, label: string, source: string): Field => ({
  key,
  label,
  type: "select",
  source,
  required: true,
});
const img = (key: string, label: string, upload: string): Field => ({
  key,
  label,
  upload,
  type: "upload",
});
const config: Record<
  string,
  {
    title: string;
    path: string;
    fields: Field[];
    columns: string[];
    create?: boolean;
  }
> = {
  movies: {
    title: "Quản lý phim",
    path: "/api/movies",
    create: true,
    columns: ["title", "duration", "releaseDate", "status"],
    fields: [
      f("title", "Tên phim"),
      f("originalTitle", "Tên gốc", "text", false),
      f("description", "Nội dung phim", "textarea"),
      f("duration", "Thời lượng (phút)", "number"),
      f("releaseDate", "Ngày khởi chiếu", "date"),
      f("endDate", "Ngày kết thúc", "date"),
      s("ageRating", "Độ tuổi", ["P", "K", "T13", "T16", "T18"]),
      f("language", "Ngôn ngữ"),
      f("country", "Quốc gia"),
      f("director", "Đạo diễn"),
      f("actors", "Diễn viên"),
      {
        key: "categoryIds",
        label: "Thể loại",
        type: "multiselect",
        source: "categories",
      },
      img("posterUrl", "Poster", "MOVIE_POSTER"),
      img("bannerUrl", "Banner", "MOVIE_BANNER"),
      f("trailerUrl", "URL trailer", "url", false),
      s("status", "Trạng thái", ["NOW_SHOWING", "COMING_SOON", "STOPPED"]),
    ],
  },
  categories: {
    title: "Quản lý thể loại",
    path: "/api/categories",
    create: true,
    columns: ["name", "description"],
    fields: [
      f("name", "Tên thể loại"),
      f("description", "Mô tả", "textarea", false),
    ],
  },
  cinemas: {
    title: "Quản lý rạp",
    path: "/api/cinemas",
    create: true,
    columns: ["name", "province", "address", "status"],
    fields: [
      f("name", "Tên rạp"),
      f("province", "Tỉnh / thành phố"),
      f("address", "Địa chỉ"),
      f("phone", "Điện thoại", "tel"),
      f("description", "Mô tả", "textarea", false),
      img("imageUrl", "Ảnh rạp", "CINEMA"),
      s("status", "Trạng thái", ["ACTIVE", "INACTIVE"]),
    ],
  },
  rooms: {
    title: "Quản lý phòng",
    path: "/api/rooms",
    create: true,
    columns: ["name", "cinemaId", "roomType", "totalSeats", "status"],
    fields: [
      r("cinemaId", "Rạp phim", "cinemas"),
      f("name", "Tên phòng"),
      s("roomType", "Loại phòng", ["STANDARD", "VIP", "IMAX"]),
      s("status", "Trạng thái", ["ACTIVE", "INACTIVE"]),
    ],
  },
  showtimes: {
    title: "Quản lý lịch chiếu",
    path: "/api/showtimes",
    create: true,
    columns: [
      "movieId",
      "cinemaId",
      "roomId",
      "showDate",
      "startTime",
      "endTime",
      "basePrice",
      "status",
    ],
    fields: [
      r("movieId", "Phim", "movies"),
      r("cinemaId", "Rạp phim", "cinemas"),
      r("roomId", "Phòng chiếu", "rooms"),
      f("showDate", "Ngày chiếu", "date"),
      f("startTime", "Giờ bắt đầu", "time"),
      f("basePrice", "Giá vé thường (đ)", "number"),
      s("status", "Trạng thái", ["AVAILABLE", "FULL", "CANCELLED", "FINISHED"]),
    ],
  },
  bookings: {
    title: "Quản lý đặt vé",
    path: "/api/bookings",
    columns: [
      "bookingCode",
      "userId",
      "movie",
      "cinema",
      "seats",
      "totalAmount",
      "status",
      "createdAt",
      "expiredAt",
    ],
    fields: [],
  },
  payments: {
    title: "Quản lý thanh toán",
    path: "/api/payments",
    columns: [
      "transactionCode",
      "bookingId",
      "userId",
      "amount",
      "paymentMethod",
      "status",
      "createdAt",
      "paidAt",
    ],
    fields: [],
  },
  users: {
    title: "Quản lý người dùng",
    path: "/api/auth/users",
    columns: ["fullName", "email", "phone", "role", "status", "createdAt"],
    fields: [],
  },
  notifications: {
    title: "Thông báo",
    path: "/api/notifications",
    columns: ["title", "message", "userId", "readStatus", "createdAt"],
    fields: [],
  },
};
const columnLabels: Record<string, string> = {
  title: "Tên phim",
  name: "Tên",
  description: "Mô tả",
  duration: "Phút",
  releaseDate: "Khởi chiếu",
  status: "Trạng thái",
  province: "Tỉnh thành",
  address: "Địa chỉ",
  cinemaId: "Rạp",
  roomType: "Loại phòng",
  totalSeats: "Số ghế",
  movieId: "Phim",
  roomId: "Phòng",
  showDate: "Ngày chiếu",
  startTime: "Bắt đầu",
  endTime: "Kết thúc",
  basePrice: "Giá cơ bản",
  bookingCode: "Mã đặt vé",
  userId: "Khách hàng",
  movie: "Phim",
  cinema: "Rạp",
  seats: "Ghế",
  totalAmount: "Tổng tiền",
  createdAt: "Ngày tạo",
  expiredAt: "Hết hạn",
  transactionCode: "Mã giao dịch",
  bookingId: "Đặt vé",
  amount: "Số tiền",
  paymentMethod: "Phương thức",
  paidAt: "Thanh toán lúc",
  fullName: "Họ tên",
  email: "Email",
  phone: "Điện thoại",
  role: "Vai trò",
  message: "Nội dung",
  readStatus: "Đã đọc",
};
const navItems: [string, string, any][] = [
  ["", "Tổng quan", LayoutDashboard],
  ["movies", "Phim", Film],
  ["categories", "Thể loại", Tags],
  ["cinemas", "Rạp phim", Building2],
  ["rooms", "Phòng chiếu", DoorOpen],
  ["seats", "Sơ đồ ghế", Armchair],
  ["showtimes", "Lịch chiếu", CalendarDays],
  ["bookings", "Đặt vé", Ticket],
  ["payments", "Thanh toán", CreditCard],
  ["users", "Người dùng", Users],
  ["notifications", "Thông báo", Bell],
  ["statistics", "Thống kê", ChartNoAxesCombined],
];
export function Admin() {
  const { resource = "" } = useParams();
  const { user, logout } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={"admin-shell " + (collapsed ? "collapsed" : "")}>
      <aside className="admin-sidebar">
        <Link to="/" className="brand">
          <img className="brand-logo" src="/logo.jpg" alt="Isolation Cinema" />
          {!collapsed && (
            <span>
              ISOLATION<small>QUẢN TRỊ RẠP PHIM</small>
            </span>
          )}
        </Link>
        <button
          className="collapse-button"
          aria-label="Thu gọn menu"
          onClick={() => setCollapsed((v) => !v)}
        >
          <PanelLeftClose size={19} />
        </button>
        <nav>
          {navItems.map(([path, title, Icon]) => (
            <NavLink
              end
              to={"/admin" + (path ? "/" + path : "")}
              key={path}
              title={title}
            >
              <Icon size={19} />
              {!collapsed && title}
            </NavLink>
          ))}
        </nav>
        <button className="logout" onClick={logout}>
          <LogOut size={18} />
          {!collapsed && "Đăng xuất"}
        </button>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <small>Không gian quản trị</small>
            <strong>Xin chào, {user?.fullName}</strong>
          </div>
          <Link to="/" className="button secondary">
            Trang khách hàng
          </Link>
        </header>
        <div className="admin-content">
          <div className="breadcrumb">
            <Link to="/admin">Quản trị</Link> /{" "}
            {config[resource]?.title ||
              navItems.find((x) => x[0] === resource)?.[1]}
          </div>
          {resource === "seats" ? (
            <SeatAdmin />
          ) : !resource || resource === "statistics" ? (
            <Dashboard />
          ) : config[resource] ? (
            <ResourcePage key={resource} resource={resource} />
          ) : (
            <Empty text="Không tìm thấy trang quản trị" />
          )}
        </div>
      </div>
    </div>
  );
}
function ResourcePage({ resource }: { resource: string }) {
  const cfg = config[resource];
  const q = useData<Row[]>(cfg.path);
  const [lookups, setLookups] = useState<Record<string, Row[]>>({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [movieFilter, setMovieFilter] = useState("");
  const [cinemaFilter, setCinemaFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Row | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    Promise.all(
      Object.entries({
        movies: "/api/movies",
        categories: "/api/categories",
        cinemas: "/api/cinemas",
        rooms: "/api/rooms",
        users: "/api/auth/users",
        bookings: "/api/bookings",
      }).map(async ([k, p]) => [k, await get(p)]),
    )
      .then((entries) => {
        if (alive) setLookups(Object.fromEntries(entries));
      })
      .catch((e) => toast.error(errorText(e)));
    return () => {
      alive = false;
    };
  }, []);
  function cell(row: Row, key: string): React.ReactNode {
    const v = row[key];
    const source: Record<string, string> = {
      movieId: "movies",
      cinemaId: "cinemas",
      roomId: "rooms",
      userId: "users",
      bookingId: "bookings",
    };
    if (source[key]) {
      const x = lookups[source[key]]?.find((x) => x.id === v);
      return x?.title || x?.name || x?.fullName || x?.bookingCode || "Đang tải";
    }
    if (
      key === "status" ||
      key === "role" ||
      key === "roomType" ||
      key === "paymentMethod"
    )
      return <Badge status={v} />;
    if (["amount", "totalAmount", "basePrice"].includes(key)) return money(v);
    if (key === "movie") return row.details?.movie.title;
    if (key === "cinema") return row.details?.cinema.name;
    if (key === "seats") return v.map((s: Row) => s.seatName).join(", ");
    if (key.endsWith("At"))
      return v ? new Date(v).toLocaleString("vi-VN") : "—";
    if (typeof v === "boolean") return v ? "Đã đọc" : "Chưa đọc";
    return v ?? "—";
  }
  const filtered =
    q.data?.filter(
      (x) =>
        JSON.stringify(x).toLowerCase().includes(search.toLowerCase()) &&
        (!status || x.status === status) &&
        (!date || x.showDate === date) &&
        (!movieFilter || String(x.movieId) === movieFilter) &&
        (!cinemaFilter || String(x.cinemaId) === cinemaFilter) &&
        (!roomFilter || String(x.roomId) === roomFilter) &&
        (!roleFilter || x.role === roleFilter),
    ) || [];
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pages);
  useEffect(
    () => setPage(1),
    [search, status, date, movieFilter, cinemaFilter, roomFilter, roleFilter],
  );
  async function remove() {
    setBusy(true);
    try {
      await send(cfg.path + "/" + deleting!.id, {}, "delete");
      toast.success("Đã xóa dữ liệu");
      setDeleting(null);
      q.reload();
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function action(x: Row, op: string) {
    setBusy(true);
    try {
      if (resource === "users")
        await send(
          cfg.path + "/" + x.id + "/status",
          { status: x.status === "ACTIVE" ? "LOCKED" : "ACTIVE" },
          "put",
        );
      else if (resource === "payments")
        await send(cfg.path + "/" + x.id + "/" + op);
      else await send(cfg.path + "/" + x.id + "/read", {}, "put");
      toast.success("Đã cập nhật");
      q.reload();
      setDetail(null);
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <div className="section-head">
        <div>
          <h1>{cfg.title}</h1>
          <p className="muted">{q.data?.length || 0} bản ghi trong hệ thống</p>
        </div>
        {cfg.create && (
          <Button onClick={() => setEditing({})}>
            <Plus size={17} />
            Thêm mới
          </Button>
        )}
      </div>
      <div className="panel table-panel">
        <div className="toolbar">
          <input
            aria-label="Tìm kiếm"
            placeholder="Tìm kiếm…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {q.data?.some((x) => x.status) && (
            <select
              aria-label="Lọc trạng thái"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {[...new Set(q.data.map((x) => x.status))].map((s) => (
                <option value={s} key={s}>
                  {labels[s] || s}
                </option>
              ))}
            </select>
          )}
          {resource === "users" && (
            <select
              aria-label="Lọc vai trò"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Tất cả vai trò</option>
              <option value="USER">Khách hàng</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          )}
          {resource === "showtimes" && (
            <>
              <input
                aria-label="Lọc ngày chiếu"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              {[
                ["movies", movieFilter, setMovieFilter, "Tất cả phim"],
                ["cinemas", cinemaFilter, setCinemaFilter, "Tất cả rạp"],
                ["rooms", roomFilter, setRoomFilter, "Tất cả phòng"],
              ].map(([key, value, setter, label]: any) => (
                <select
                  key={key}
                  aria-label={label}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                >
                  <option value="">{label}</option>
                  {lookups[key]?.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.title || x.name}
                    </option>
                  ))}
                </select>
              ))}
            </>
          )}
        </div>
        {q.loading ? (
          <Skeleton />
        ) : q.error ? (
          <ErrorBox message={q.error} retry={q.reload} />
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {cfg.columns.map((c) => (
                      <th key={c}>{columnLabels[c]}</th>
                    ))}
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .slice((currentPage - 1) * 10, currentPage * 10)
                    .map((x) => (
                      <tr key={x.id}>
                        {cfg.columns.map((c) => (
                          <td key={c}>{cell(x, c)}</td>
                        ))}
                        <td>
                          <div className="row-actions">
                            <button
                              title="Xem chi tiết"
                              aria-label="Xem chi tiết"
                              onClick={() => setDetail(x)}
                            >
                              <Eye size={17} />
                            </button>
                            {cfg.create && (
                              <>
                                <button
                                  title="Chỉnh sửa"
                                  aria-label="Chỉnh sửa"
                                  onClick={() =>
                                    setEditing({
                                      ...x,
                                      categoryIds:
                                        x.categories?.map((c: Row) => c.id) ||
                                        [],
                                    })
                                  }
                                >
                                  <Pencil size={17} />
                                </button>
                                <button
                                  title="Xóa"
                                  aria-label="Xóa"
                                  onClick={() => setDeleting(x)}
                                >
                                  <Trash2 size={17} />
                                </button>
                              </>
                            )}
                            {resource === "rooms" && (
                              <Link
                                to={"/admin/seats?room=" + x.id}
                                title="Sơ đồ ghế"
                              >
                                <Armchair size={17} />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {!filtered.length && <Empty />}
            <div className="pagination">
              <span>{filtered.length} kết quả</span>
              <button
                className="icon-button"
                disabled={currentPage === 1}
                aria-label="Trang trước"
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={18} />
              </button>
              <span>
                {currentPage} / {pages}
              </span>
              <button
                className="icon-button"
                disabled={currentPage === pages}
                aria-label="Trang sau"
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}
      </div>
      {editing && (
        <Editor
          resource={resource}
          initial={editing}
          lookups={lookups}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            q.reload();
          }}
        />
      )}
      {deleting && (
        <Modal title="Xác nhận xóa" onClose={() => setDeleting(null)}>
          <p>
            Bạn muốn xóa “{deleting.title || deleting.name}”? Dữ liệu đang được
            sử dụng sẽ được hệ thống bảo vệ.
          </p>
          <div className="form-actions">
            <button className="secondary" onClick={() => setDeleting(null)}>
              Giữ lại
            </button>
            <Button className="danger" busy={busy} onClick={remove}>
              Xóa dữ liệu
            </Button>
          </div>
        </Modal>
      )}
      {detail && (
        <Modal title="Thông tin chi tiết" onClose={() => setDetail(null)}>
          {resource === "bookings" ? (
            <>
              <BookingInfo booking={detail} />
              <DetailPayment bookingId={detail.id} />
              <Timeline row={detail} />
            </>
          ) : resource === "payments" ? (
            <>
              <PaymentBooking bookingId={detail.bookingId} />
              <dl className="facts">
                {cfg.columns.map((c) => (
                  <div key={c}>
                    <dt>{columnLabels[c]}</dt>
                    <dd>{cell(detail, c)}</dd>
                  </div>
                ))}
              </dl>
              <p className="transaction">Nội dung QR: {detail.qrContent}</p>
              {detail.status === "PENDING" && (
                <div className="form-actions">
                  <Button busy={busy} onClick={() => action(detail, "confirm")}>
                    Xác nhận thanh toán
                  </Button>
                  <Button
                    className="danger"
                    busy={busy}
                    onClick={() => action(detail, "fail")}
                  >
                    Từ chối
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <dl className="facts">
                {[...new Set([...cfg.columns, ...cfg.fields.map((f) => f.key)])]
                  .filter((c) => !c.endsWith("Url") && c !== "categoryIds")
                  .map((c) => (
                    <div key={c}>
                      <dt>
                        {columnLabels[c] ||
                          cfg.fields.find((f) => f.key === c)?.label}
                      </dt>
                      <dd>{cell(detail, c)}</dd>
                    </div>
                  ))}
              </dl>
              {detail.posterUrl && (
                <Poster src={detail.posterUrl} alt={detail.title} />
              )}{" "}
              {detail.imageUrl && (
                <Poster src={detail.imageUrl} alt={detail.name} />
              )}{" "}
              {resource === "users" && (
                <>
                  <Button busy={busy} onClick={() => action(detail, "status")}>
                    {detail.status === "ACTIVE"
                      ? "Khóa tài khoản"
                      : "Mở khóa tài khoản"}
                  </Button>
                  <h3>Lịch sử đặt vé</h3>
                  {lookups.bookings
                    ?.filter((b) => b.userId === detail.id)
                    .map((b) => (
                      <p key={b.id}>
                        {b.bookingCode} · {money(b.totalAmount)} ·{" "}
                        {labels[b.status]}
                      </p>
                    ))}
                </>
              )}
              {resource === "cinemas" && (
                <>
                  <h3>Phòng thuộc rạp</h3>
                  {lookups.rooms
                    ?.filter((r) => r.cinemaId === detail.id)
                    .map((r) => (
                      <p key={r.id}>
                        {r.name} · {r.totalSeats} ghế
                      </p>
                    ))}
                </>
              )}
              {resource === "notifications" && !detail.readStatus && (
                <Button onClick={() => action(detail, "read")}>
                  Đánh dấu đã đọc
                </Button>
              )}
            </>
          )}
        </Modal>
      )}
    </section>
  );
}
function Timeline({ row }: { row: Row }) {
  return (
    <div className="timeline">
      {[
        ["createdAt", "Tạo đặt vé"],
        ["expiredAt", "Hạn giữ ghế"],
        ["confirmedAt", "Xác nhận"],
        ["cancelledAt", "Hủy vé"],
      ].map(
        ([k, l]) =>
          row[k] && (
            <p key={k}>
              <strong>{l}</strong> {new Date(row[k]).toLocaleString("vi-VN")}
            </p>
          ),
      )}
    </div>
  );
}
function DetailPayment({ bookingId }: { bookingId: number }) {
  const q = useData<Row>("/api/payments/booking/" + bookingId);
  return (
    <p>
      Thanh toán:{" "}
      {q.data
        ? q.data.transactionCode + " · " + labels[q.data.status]
        : q.loading
          ? "Đang tải…"
          : "Chưa có giao dịch"}
    </p>
  );
}
function PaymentBooking({ bookingId }: { bookingId: number }) {
  const q = useData<Row>("/api/bookings/" + bookingId);
  return q.data ? (
    <BookingInfo booking={q.data} />
  ) : q.error ? (
    <p>{q.error}</p>
  ) : (
    <Skeleton />
  );
}
function Editor({
  resource,
  initial,
  lookups,
  onClose,
  onSaved,
}: {
  resource: string;
  initial: Row;
  lookups: Record<string, Row[]>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const cfg = config[resource];
  const [form, setForm] = useState<Row>(() =>
    Object.fromEntries(
      cfg.fields.map((f) => [
        f.key,
        initial[f.key] ??
          (f.type === "multiselect" ? [] : f.options?.[0] || ""),
      ]),
    ),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const update = (k: string, v: any) =>
    setForm((x) => ({
      ...x,
      [k]: v,
      ...(k === "cinemaId" ? { roomId: "" } : {}),
    }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = { ...form };
      for (const f of cfg.fields)
        if (f.type === "number" || (f.source && f.type === "select"))
          payload[f.key] = Number(payload[f.key]);
      if (resource === "rooms") payload.totalSeats = initial.totalSeats || 0;
      await send(
        cfg.path + (initial.id ? "/" + initial.id : ""),
        payload,
        initial.id ? "put" : "post",
      );
      toast.success("Đã lưu dữ liệu");
      onSaved();
    } catch (e: any) {
      setError(
        errorText(e) +
          (e.response?.data?.errors
            ? " · " + Object.values(e.response.data.errors).join(", ")
            : ""),
      );
    } finally {
      setBusy(false);
    }
  }
  const duration = lookups.movies?.find(
    (m) => String(m.id) === String(form.movieId),
  )?.duration;
  let end = "";
  if (resource === "showtimes" && form.startTime && duration) {
    const [h, m] = form.startTime.split(":").map(Number);
    const mins = h * 60 + m + duration;
    end =
      Math.floor((mins / 60) % 24)
        .toString()
        .padStart(2, "0") +
      ":" +
      (mins % 60).toString().padStart(2, "0") +
      (mins >= 1440 ? " (hôm sau)" : "");
  }
  return (
    <Modal
      title={
        (initial.id ? "Chỉnh sửa · " : "Thêm mới · ") +
        cfg.title.replace("Quản lý ", "")
      }
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          {cfg.fields.map((f) =>
            f.upload ? (
              <UploadField
                key={f.key}
                label={f.label}
                type={f.upload}
                value={form[f.key]}
                onChange={(v) => update(f.key, v)}
              />
            ) : (
              <label
                key={f.key}
                className={f.type === "textarea" ? "wide" : ""}
              >
                {f.label}
                {f.required && " *"}
                {f.type === "select" ? (
                  <select
                    required={f.required}
                    value={form[f.key]}
                    onChange={(e) => update(f.key, e.target.value)}
                  >
                    {f.source && (
                      <option value="">Chọn {f.label.toLowerCase()}</option>
                    )}
                    {f.options?.map((x) => (
                      <option key={x} value={x}>
                        {labels[x] || x}
                      </option>
                    ))}
                    {f.source &&
                      lookups[f.source]
                        ?.filter(
                          (x) =>
                            f.key !== "roomId" ||
                            String(x.cinemaId) === String(form.cinemaId),
                        )
                        .map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.title || x.name}
                          </option>
                        ))}
                  </select>
                ) : f.type === "multiselect" ? (
                  <div className="checkboxes">
                    {lookups[f.source!]?.map((x) => (
                      <label key={x.id}>
                        <input
                          type="checkbox"
                          checked={form[f.key].includes(x.id)}
                          onChange={(e) =>
                            update(
                              f.key,
                              e.target.checked
                                ? [...form[f.key], x.id]
                                : form[f.key].filter((v: number) => v !== x.id),
                            )
                          }
                        />
                        {x.name}
                      </label>
                    ))}
                  </div>
                ) : f.type === "textarea" ? (
                  <textarea
                    required={f.required}
                    value={form[f.key]}
                    onChange={(e) => update(f.key, e.target.value)}
                  />
                ) : (
                  <input
                    type={f.type}
                    required={f.required}
                    min={f.type === "number" ? 1 : undefined}
                    value={form[f.key]}
                    onChange={(e) => update(f.key, e.target.value)}
                  />
                )}
              </label>
            ),
          )}
        </div>
        {end && (
          <p>
            Giờ kết thúc dự kiến: <strong>{end}</strong> · {duration} phút
          </p>
        )}
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Hủy
          </button>
          <Button type="submit" busy={busy}>
            Lưu {resource === "movies" ? "phim" : "dữ liệu"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function SeatAdmin() {
  const rooms = useData<Row[]>("/api/rooms");
  const [room, setRoom] = useState(
    new URLSearchParams(window.location.search).get("room") || "",
  );
  const q = useData<Row[]>(room ? "/api/rooms/" + room + "/seats" : undefined);
  const [selected, setSelected] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  async function generate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await send("/api/rooms/" + room + "/generate-seats", {
        rows: Number(f.get("rows")),
        columns: Number(f.get("columns")),
      });
      q.reload();
      toast.success("Đã tạo sơ đồ ghế");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      await send(
        "/api/seats/" + selected!.id,
        Object.fromEntries(new FormData(e.currentTarget)),
        "put",
      );
      setSelected(null);
      q.reload();
      toast.success("Đã cập nhật ghế");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h1>Quản lý sơ đồ ghế</h1>
      <label className="narrow">
        Phòng chiếu
        <select value={room} onChange={(e) => setRoom(e.target.value)}>
          <option value="">Chọn phòng chiếu</option>
          {rooms.data?.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} · {r.roomType}
            </option>
          ))}
        </select>
      </label>
      {room &&
        (q.loading ? (
          <Skeleton />
        ) : q.error ? (
          <ErrorBox message={q.error} retry={q.reload} />
        ) : q.data?.length ? (
          <div className="panel seat-panel">
            <div className="screen">MÀN HÌNH</div>
            <div className="seat-scroll">
              <div className="seat-map">
                {[...new Set(q.data.map((s) => s.rowName))].map((row) => (
                  <div className="seat-row" key={row}>
                    <span>{row}</span>
                    {q.data
                      ?.filter((s) => s.rowName === row)
                      .map((s) => (
                        <button
                          className={
                            "seat " +
                            s.seatType.toLowerCase() +
                            " " +
                            (s.status === "LOCKED" ? "locked" : "")
                          }
                          key={s.id}
                          title={s.rowName + s.seatNumber}
                          onClick={() => setSelected(s)}
                        >
                          {s.seatNumber}
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            </div>
            <p className="muted">
              Chọn ghế để đổi loại, khóa hoặc mở khóa. Vé đã bán giữ nguyên đơn
              giá.
            </p>
          </div>
        ) : (
          <form className="panel narrow" onSubmit={generate}>
            <h2>Tạo ghế cho phòng</h2>
            <label>
              Số hàng
              <input
                name="rows"
                type="number"
                min="1"
                max="26"
                defaultValue="8"
                required
              />
            </label>
            <label>
              Số ghế mỗi hàng
              <input
                name="columns"
                type="number"
                min="1"
                max="20"
                defaultValue="8"
                required
              />
            </label>
            <Button busy={busy}>Tạo sơ đồ ghế</Button>
          </form>
        ))}
      {selected && (
        <Modal
          title={"Ghế " + selected.rowName + selected.seatNumber}
          onClose={() => setSelected(null)}
        >
          <form onSubmit={save}>
            <label>
              Loại ghế
              <select name="seatType" defaultValue={selected.seatType}>
                {["NORMAL", "VIP", "COUPLE"].map((t) => (
                  <option key={t} value={t}>
                    {labels[t]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Trạng thái
              <select name="status" defaultValue={selected.status}>
                <option value="ACTIVE">Mở ghế</option>
                <option value="LOCKED">Khóa ghế</option>
              </select>
            </label>
            <Button busy={busy}>Lưu thay đổi</Button>
          </form>
        </Modal>
      )}
    </section>
  );
}
function Dashboard() {
  const [data, setData] = useState<Record<string, Row[]> | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.all(
      Object.entries({
        movies: "/api/movies",
        cinemas: "/api/cinemas",
        rooms: "/api/rooms",
        users: "/api/auth/users",
        bookings: "/api/bookings",
        payments: "/api/payments",
        showtimes: "/api/showtimes",
      }).map(async ([k, p]) => [k, await get(p)]),
    )
      .then((x) => {
        if (active) {
          setData(Object.fromEntries(x));
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(errorText(e));
      });
    return () => {
      active = false;
    };
  }, [retry]);
  if (error)
    return <ErrorBox message={error} retry={() => setRetry((v) => v + 1)} />;
  if (!data) return <Skeleton />;
  const { movies, cinemas, rooms, users, bookings, payments, showtimes } = data;
  const day = (d: string) => new Date(d).toLocaleDateString("sv-SE");
  const today = day(new Date().toISOString());
  const successes = payments.filter((p) => p.status === "SUCCESS");
  const paidFor = (date: string) =>
    successes
      .filter((p) => p.paidAt && day(p.paidAt) === date)
      .reduce((s, p) => s + p.amount, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const key = day(date.toISOString());
    return {
      name: date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      }),
      revenue: paidFor(key),
      count: bookings.filter((b) => day(b.createdAt) === key).length,
    };
  });
  const stats: [string, any][] = [
    ["Tổng phim", movies.length],
    [
      "Phim đang chiếu",
      movies.filter((m) => m.status === "NOW_SHOWING").length,
    ],
    ["Phim sắp chiếu", movies.filter((m) => m.status === "COMING_SOON").length],
    ["Tổng rạp", cinemas.length],
    ["Tổng phòng", rooms.length],
    ["Khách hàng", users.length],
    ["Tổng đặt vé", bookings.length],
    [
      "Đặt vé hôm nay",
      bookings.filter((b) => day(b.createdAt) === today).length,
    ],
    ["Chờ thanh toán", bookings.filter((b) => b.status === "PENDING").length],
    ["Đã xác nhận", bookings.filter((b) => b.status === "CONFIRMED").length],
    ["Doanh thu hôm nay", money(paidFor(today))],
    [
      "Doanh thu tháng",
      money(
        successes
          .filter(
            (p) => p.paidAt && day(p.paidAt).slice(0, 7) === today.slice(0, 7),
          )
          .reduce((s, p) => s + p.amount, 0),
      ),
    ],
    [
      "Suất chiếu hôm nay",
      showtimes.filter((s) => s.showDate === today).length,
    ],
  ];
  const states = ["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED"].map((s) => ({
    name: labels[s],
    value: bookings.filter((b) => b.status === s).length,
  }));
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
  const group = (getter: (b: Row) => string, value: (b: Row) => number) => {
    const m = new Map<string, number>();
    confirmed.forEach((b) => {
      const k = getter(b);
      m.set(k, (m.get(k) || 0) + value(b));
    });
    return [...m]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };
  const topMovies = group(
    (b) => b.details.movie.title,
    (b) => b.seats.length,
  );
  const topCinemas = group(
    (b) => b.details.cinema.name,
    (b) => b.totalAmount,
  );
  const hours = group(
    (b) => b.details.showtime.startTime.slice(0, 2) + ":00",
    (b) => b.seats.length,
  );
  function bar(title: string, list: Row[], key = "value") {
    return (
      <div className="panel chart-panel">
        <h3>{title}</h3>
        {list.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={list}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis width={65} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey={key} fill="#1555e8" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty text="Chưa có dữ liệu" />
        )}
      </div>
    );
  }
  return (
    <section>
      <div className="section-head">
        <div>
          <span className="eyebrow">HOẠT ĐỘNG KINH DOANH</span>
          <h1>Tổng quan hôm nay</h1>
        </div>
        <span className="muted">
          {new Date().toLocaleDateString("vi-VN", { dateStyle: "full" })}
        </span>
      </div>
      <div className="stats-grid">
        {stats.map(([name, v], i) => (
          <motion.div
            className="stat-card"
            key={name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.025 }}
          >
            <span>{name}</span>
            <strong>{v}</strong>
          </motion.div>
        ))}
      </div>
      <div className="charts-grid">
        <div className="panel chart-panel">
          <h3>Doanh thu 7 ngày</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={days}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis width={75} />
              <Tooltip formatter={(v: any) => money(Number(v))} />
              <Area
                dataKey="revenue"
                name="Doanh thu"
                stroke="#1555e8"
                fill="#dfeaff"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {bar("Đặt vé trong 7 ngày", days, "count")}
        <div className="panel chart-panel">
          <h3>Đặt vé theo trạng thái</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={states}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
              >
                {states.map((s, i) => (
                  <Cell
                    key={s.name}
                    fill={["#f2af37", "#1555e8", "#e26b75", "#9ca8bd"][i]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="legend">
            {states.map((s) => (
              <span key={s.name}>
                {s.name}: {s.value}
              </span>
            ))}
          </div>
        </div>
        {bar("Phim bán vé nhiều nhất", topMovies)}
        {bar("Rạp có doanh thu cao", topCinemas)}
        {bar("Khung giờ đông khách", hours)}
      </div>
    </section>
  );
}
