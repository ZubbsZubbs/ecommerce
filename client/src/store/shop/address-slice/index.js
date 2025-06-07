import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const initialState = {
  isLoading: false,
  addressList: [],
};

// Add a new address
export const addNewAddress = createAsyncThunk(
  "/addresses/addNewAddress",
  async (formData) => {
    const response = await axios.post(`${API_BASE_URL}/shop/address/add`, formData);
    return response.data;
  }
);

// Fetch all addresses for a user
export const fetchAllAddresses = createAsyncThunk(
  "/addresses/fetchAllAddresses",
  async (userId) => {
    const response = await axios.get(`${API_BASE_URL}/shop/address/get/${userId}`);
    return response.data;
  }
);

// Edit an existing address
export const editaAddress = createAsyncThunk(
  "/addresses/editaAddress",
  async ({ userId, addressId, formData }) => {
    const response = await axios.put(
      `${API_BASE_URL}/shop/address/update/${userId}/${addressId}`,
      formData
    );
    return response.data;
  }
);

// Delete an address
export const deleteAddress = createAsyncThunk(
  "/addresses/deleteAddress",
  async ({ userId, addressId }) => {
    const response = await axios.delete(
      `${API_BASE_URL}/shop/address/delete/${userId}/${addressId}`
    );
    return { ...response.data, addressId };
  }
);

const addressSlice = createSlice({
  name: "address",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Add new address
      .addCase(addNewAddress.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addNewAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.data) {
          state.addressList.push(action.payload.data);
        }
      })
      .addCase(addNewAddress.rejected, (state) => {
        state.isLoading = false;
      })

      // Fetch all addresses
      .addCase(fetchAllAddresses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllAddresses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addressList = action.payload.data;
      })
      .addCase(fetchAllAddresses.rejected, (state) => {
        state.isLoading = false;
        state.addressList = [];
      })

      // Edit address
      .addCase(editaAddress.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(editaAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.data) {
          const idx = state.addressList.findIndex(
            (addr) => addr._id === action.payload.data._id
          );
          if (idx !== -1) {
            state.addressList[idx] = action.payload.data;
          }
        }
      })
      .addCase(editaAddress.rejected, (state) => {
        state.isLoading = false;
      })

      // Delete address
      .addCase(deleteAddress.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        const idToDelete = action.payload.addressId;
        state.addressList = state.addressList.filter(addr => addr._id !== idToDelete);
      })
      .addCase(deleteAddress.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export default addressSlice.reducer;
