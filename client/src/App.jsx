import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import HostRoute from "./components/HostRoute";
import ScrollToTop from "./components/ScrollToTop";
import HostListings from "./pages/host/HostListings";
import NewListing from "./pages/host/NewListing";
import MyBookings from "./pages/MyBookings";
import ListingDetails from "./pages/ListingDetails";
import HostBookings from "./pages/host/HostBookings";
import HostAnalytics from "./pages/host/HostAnalytics";
import JoinGroup from "./pages/JoinGroup";
import EditListing from "./pages/host/EditListing";
import Listings from "./pages/Listings";
import HostReviews from "./pages/host/HostReviews";
import Wishlist from "./pages/Wishlist";
import BookingChat from "./pages/BookingChat";
import CompareListings from "./pages/CompareListings";
import MainLayout from "./layouts/MainLayout";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/listing/:id" element={<ListingDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/join/:groupId" element={<JoinGroup />} />

          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat/:bookingId"
            element={
              <ProtectedRoute>
                <BookingChat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/compare"
            element={
              <ProtectedRoute>
                <CompareListings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/host/listings"
            element={
              <HostRoute>
                <HostListings />
              </HostRoute>
            }
          />

          <Route
            path="/host/listings/new"
            element={
              <HostRoute>
                <NewListing />
              </HostRoute>
            }
          />

          <Route
            path="/host/bookings"
            element={
              <HostRoute>
                <HostBookings />
              </HostRoute>
            }
          />

          <Route
            path="/host/analytics"
            element={
              <HostRoute>
                <HostAnalytics />
              </HostRoute>
            }
          />

          <Route
            path="/host/listings/edit/:id"
            element={
              <HostRoute>
                <EditListing />
              </HostRoute>
            }
          />

          <Route
            path="/host/reviews"
            element={
              <HostRoute>
                <HostReviews />
              </HostRoute>
            }
          />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}