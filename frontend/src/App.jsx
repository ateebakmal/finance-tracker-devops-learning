import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import LoginPage from "./features/auth/LoginPage";
import SignupPage from "./features/auth/SignupPage";
import ProtectedRoutes from "./components/ProtectedRoutes";
import Dashboard from "./features/dashboard/Dashboard";
import ModalRenderer from "./components/modal/ModalRenderer";
import AppLayout from "./components/AppLayout";
import Test from "./Test.jsx";
import Profile from "./features/profiles/Profile";
import Categories from "./features/categories/Categories";
import Tags from "./features/tags/Tags";
import AddTransaction from "./features/transactions/AddTransactionPage";
import TransactionsPage from "./features/transactions/TransactionsPage";
import Setup from "./features/setup/SetupPage";
import RequireProfile from "./features/profiles/RequireProfile";
import AnalyticsPage from "./features/analytics/AnalyticsPage";
import TransactionDetailPage from "./features/transactions/TransactionDetailPage";
import AddTransactionPage from "./features/transactions/addAndEditTransaction/AddTransactionPage";
import EditTransactionPage from "./features/transactions/addAndEditTransaction/EditTransactionPage";

function Home() {
  return <Navigate to={"/dashboard"} replace />;
}
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />}></Route>
        <Route path="/signup" element={<SignupPage />}></Route>
        <Route element={<ProtectedRoutes />}>
          <Route path="/setup" element={<Setup />} />
          <Route element={<RequireProfile />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route
                path="/transactions/:id"
                element={<TransactionDetailPage />}
              />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/categories" element={<Categories />} />
              <Route path="/profile/tags" element={<Tags />} />
            </Route>
            <Route path="/add-transaction" element={<AddTransactionPage />} />
            <Route
              path="/transactions/:id/edit"
              element={<EditTransactionPage />}
            />
          </Route>
        </Route>
        <Route path="/test" element={<Test />} />
      </Routes>
      <ModalRenderer />
    </BrowserRouter>
  );
}

export default App;
