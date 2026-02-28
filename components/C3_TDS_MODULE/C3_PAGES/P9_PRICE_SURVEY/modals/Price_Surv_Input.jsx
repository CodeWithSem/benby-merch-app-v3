import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import tw from "twrnc";
import { ref, update } from "firebase/database";
import { db } from "../../../../../assets/scripts/firebase";

const Price_Surv_Input = ({
  is_open,
  set_display_modal,
  selected_item,
  price_surv_data,
  set_price_surv_data,
}) => {
  // Input States
  const [srp, setSrp] = useState("");
  const [compPrice, setCompPrice] = useState("");
  const [promo, setPromo] = useState("");
  const [remarks, setRemarks] = useState("");

  // UI States
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (is_open && selected_item) {
      setSrp(selected_item.srp || "");
      setCompPrice(selected_item.competitor_price || "");
      setPromo(selected_item.promo_discount || "");
      setRemarks(selected_item.remarks || "");
      setIsProcessing(false);
    }
  }, [is_open, selected_item]);

  // Automatic Calculation of Price Difference
  const getPriceDiff = () => {
    const s = parseFloat(srp) || 0;
    const c = parseFloat(compPrice) || 0;
    if (s === 0 && c === 0) return "0.00";
    return (s - c).toFixed(2);
  };

  const handleSave = async () => {
    if (!srp || !compPrice) {
      Alert.alert("Required", "Please enter both SRP and Competitor Price.");
      return;
    }

    setIsProcessing(true);
    const date_now = new Date();

    const formatToMMDDYYYY = (date) => {
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    try {
      // 1. Prepare Local/Main DB Object (Using your local state keys)
      const updatedEntry = {
        ...selected_item,
        srp: srp,
        competitor_price: compPrice,
        price_diff: getPriceDiff(),
        promo_discount: promo,
        remarks: remarks,
      };

      // 2. Update Main Firebase Data (Nested Path)
      const dbPath = `DB_TEST/TBL_PRICE_SURVEY/DATA/${selected_item.tds_code}/${selected_item.store_code}/${selected_item.id}`;
      await update(ref(db, dbPath), updatedEntry);

      // 3. Prepare History Object (Mapping to your specific API/History fields)
      const historySeriesKey = `${selected_item.tds_code}_${selected_item.store_code}_${selected_item.id}`;

      const historyData = {
        [historySeriesKey]: {
          iD: selected_item.id,
          code: selected_item.tds_code,
          storecode: selected_item.store_code,
          rowNo: selected_item.row_no || "1",
          productName: selected_item.product_name,
          brand: selected_item.brand,
          packSize: selected_item.pack_size,
          sRP: srp,
          competitorPrize: compPrice,
          priceDifference: getPriceDiff(),
          promoDiscount: promo,
          remarks: remarks,
          dateUpload: selected_item.date_uploaded,
          uploadedBy: selected_item.uploaded_by,
          audit_date: formatToMMDDYYYY(date_now),
        },
      };

      // 4. Save to Price Survey History (Flat Path)
      const historyRef = ref(db, "DB_TEST/TBL_PRICE_SURVEY_HISTORY/DATA");
      await update(historyRef, historyData);

      // 5. Update Local State for the FlatList
      const updatedData = price_surv_data.map((item) =>
        item.id === selected_item.id ? updatedEntry : item,
      );
      set_price_surv_data(updatedData);

      setIsProcessing(false);
      set_display_modal(null);
      Alert.alert("Success", "Price Survey history has been updated.");
    } catch (error) {
      console.error("Save failed:", error);
      Alert.alert(
        "Error",
        "Could not save data. Please check your connection.",
      );
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={is_open}
      onRequestClose={() => !isProcessing && set_display_modal(null)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1`}
      >
        <View style={tw`flex-1 justify-end bg-black/40`}>
          <Pressable
            style={tw`absolute inset-0`}
            onPress={() => !isProcessing && set_display_modal(null)}
          />

          <View style={tw`bg-white rounded-t-3xl shadow-2xl`}>
            <View
              style={tw`w-12 h-1.5 bg-gray-200 rounded-full self-center mt-4 mb-2`}
            />

            <ScrollView contentContainerStyle={tw`p-6`}>
              {isProcessing ? (
                <View style={tw`items-center py-10`}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={tw`mt-4 text-gray-500 font-medium`}>
                    Saving data...
                  </Text>
                </View>
              ) : (
                <View>
                  <View style={tw`flex-row justify-between items-start mb-6`}>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-xl font-bold text-gray-900`}>
                        {selected_item?.product_name}
                      </Text>
                      <Text
                        style={tw`text-gray-500 text-xs font-bold uppercase mt-1 tracking-wider`}
                      >
                        {selected_item?.brand} • {selected_item?.pack_size}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => set_display_modal(null)}
                      style={tw`p-1`}
                    >
                      <AntDesign name="close" size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>

                  {/* Pricing Inputs */}
                  <View style={tw`flex-row gap-x-3 mb-5`}>
                    <View style={tw`flex-1`}>
                      <Text
                        style={tw`text-[10px] text-gray-400 font-bold uppercase mb-2`}
                      >
                        SRP
                      </Text>
                      <TextInput
                        style={tw`bg-gray-50 border border-gray-200 rounded-xl p-4 text-lg font-black text-gray-800`}
                        keyboardType="numeric"
                        value={srp}
                        onChangeText={setSrp}
                        placeholder="0.00"
                      />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text
                        style={tw`text-[10px] text-gray-400 font-bold uppercase mb-2`}
                      >
                        Comp. Price
                      </Text>
                      <TextInput
                        style={tw`bg-gray-50 border border-gray-200 rounded-xl p-4 text-lg font-black text-gray-800`}
                        keyboardType="numeric"
                        value={compPrice}
                        onChangeText={setCompPrice}
                        placeholder="0.00"
                      />
                    </View>
                  </View>

                  {/* Real-time Difference Display */}
                  <View
                    style={tw`mb-5 bg-green-50 p-4 rounded-xl flex-row justify-between items-center`}
                  >
                    <Text
                      style={tw`text-green-700 font-bold text-xs uppercase`}
                    >
                      Price Difference
                    </Text>
                    <Text
                      style={tw`text-green-700 font-bold text-lg uppercase`}
                    >
                      {getPriceDiff()}
                    </Text>
                  </View>

                  <View style={tw`mb-5`}>
                    <Text
                      style={tw`text-[10px] text-gray-400 font-bold uppercase mb-2`}
                    >
                      Promo / Discount
                    </Text>
                    <TextInput
                      style={tw`bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 text-sm`}
                      value={promo}
                      onChangeText={setPromo}
                      placeholder="e.g. 5% off, Buy 1 Take 1"
                    />
                  </View>

                  <View style={tw`mb-8`}>
                    <Text
                      style={tw`text-[10px] text-gray-400 font-bold uppercase mb-2`}
                    >
                      Remarks
                    </Text>
                    <TextInput
                      style={tw`bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 min-h-[80px] text-sm`}
                      multiline
                      textAlignVertical="top"
                      value={remarks}
                      onChangeText={setRemarks}
                      placeholder="Notes on competitor activity..."
                    />
                  </View>

                  {/* Action Buttons */}
                  <View style={tw`flex-row gap-x-3 pb-6`}>
                    <TouchableOpacity
                      onPress={() => set_display_modal(null)}
                      style={tw`flex-1 py-4 bg-gray-100 border border-gray-200 rounded-xl items-center justify-center`}
                    >
                      <Text style={tw`text-gray-600 font-bold`}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSave}
                      style={tw`flex-2 py-4 bg-[#028543] rounded-xl items-center justify-center`}
                    >
                      <Text style={tw`text-white font-bold`}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default Price_Surv_Input;
