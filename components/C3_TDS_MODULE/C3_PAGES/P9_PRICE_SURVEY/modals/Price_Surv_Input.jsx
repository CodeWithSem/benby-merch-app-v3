import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { ref, update } from "firebase/database";
import { db } from "../../../../../assets/scripts/firebase";
import { formate_date } from "../../../../../assets/scripts/functions/format_value";

const Price_Surv_Input = ({
  is_open,
  set_display_modal,
  selected_item,
  price_surv_data,
  set_price_surv_data,
}) => {
  const TBL_PRICE_SURVEY_PATH = "/DB_TEST/TBL_PRICE_SURVEY/DATA";
  const TBL_PRICE_SURVEY_HISTORY_PATH =
    "/DB_TEST/TBL_PRICE_SURVEY_HISTORY/DATA";

  const [srp, setSrp] = useState("");
  const [competitors, setCompetitors] = useState([
    { id: Date.now(), name: "", price: "", promo: "", remarks: "" },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (is_open && selected_item) {
      setSrp(selected_item.srp || "");
      if (selected_item.competitors && selected_item.competitors.length > 0) {
        setCompetitors(selected_item.competitors);
      } else {
        setCompetitors([
          { id: Date.now(), name: "", price: "", promo: "", remarks: "" },
        ]);
      }
      setIsProcessing(false);
    }
  }, [is_open, selected_item]);

  const addCompetitor = () => {
    setCompetitors([
      ...competitors,
      { id: Date.now(), name: "", price: "", promo: "", remarks: "" },
    ]);
  };

  const removeCompetitor = (id) => {
    if (competitors.length === 1) return;
    setCompetitors(competitors.filter((c) => c.id !== id));
  };

  const updateCompetitor = (id, field, value) => {
    setCompetitors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const handleSave = async () => {
    const isInvalid = competitors.some(
      (c) => !c.name.trim() || !c.price.trim(),
    );

    if (!srp || isInvalid) {
      Alert.alert(
        "Required",
        "Please fill up the SRP and all Competitor Names and Prices.",
      );
      return;
    }

    setIsProcessing(true);
    const date_now = new Date();
    const dateStr = formate_date(date_now, "mm/dd/yyyy");

    try {
      const updates = {};

      // 1. Path para sa Main Table (Dito array pa rin ang competitors para sa current state)
      const mainPath = `${TBL_PRICE_SURVEY_PATH}/${selected_item.tds_code}/${selected_item.store_code}/${selected_item.id}`;
      const updatedEntry = {
        ...selected_item,
        srp,
        competitors,
        last_updated: dateStr,
        status: "Complete",
      };
      updates[mainPath] = updatedEntry;

      // 2. Loop para i-flat ang History Table (One row per competitor)
      competitors.forEach((comp, index) => {
        // Gumawa ng unique key para sa bawat competitor sa history para hindi mag-overwrite
        // Format: TDSCODE_STORECODE_ITEMID_INDEX
        const historySeriesKey = `${selected_item.tds_code}_${selected_item.store_code}_${selected_item.id}_${index}`;

        const priceDiff =
          (parseFloat(srp) || 0) - (parseFloat(comp.price) || 0);

        updates[`${TBL_PRICE_SURVEY_HISTORY_PATH}/${historySeriesKey}`] = {
          iD: selected_item.id,
          code: selected_item.tds_code,
          storecode: selected_item.store_code,
          rowNo: selected_item.row_no || "1",
          productName: selected_item.product_name,
          brand: selected_item.brand,
          packSize: selected_item.pack_size,
          sRP: srp,
          // Eto na yung flat fields para sa bawat competitor
          competitorProduct: comp.name,
          competitorPrize: comp.price,
          priceDifference: priceDiff.toFixed(2),
          promoDiscount: comp.promo,
          remarks: comp.remarks,
          dateUpload: selected_item.date_uploaded || dateStr,
          uploadedBy: selected_item.uploaded_by || "",
          audit_date: dateStr,
        };
      });

      // Isang bagsakan na update sa Firebase
      await update(ref(db), updates);

      // Update local state
      const updatedData = price_surv_data.map((item) =>
        item.id === selected_item.id ? updatedEntry : item,
      );

      set_price_surv_data(updatedData);
      set_display_modal(null);
      Alert.alert("Success", "Price Survey has been saved.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save data.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderInputField = (
    label,
    value,
    placeholder,
    onChange,
    keyboardType = "default",
    multiline = false,
  ) => (
    <View style={tw`mb-4`}>
      <Text
        style={tw`text-[10px] text-gray-400 font-bold uppercase mb-1.5 ml-1`}
      >
        {label}
      </Text>
      <TextInput
        style={[
          tw`bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800 ${multiline ? "min-h-[80px]" : ""}`,
          {
            textAlignVertical: "center",
            includeFontPadding: false,
          },
        ]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );

  return (
    <Modal animationType="fade" visible={is_open} transparent={false}>
      <SafeAreaView style={tw`flex-1 bg-white`}>
        {/* Header with Back Button */}
        <View
          style={tw`flex-row items-center px-4 py-3 border-b border-gray-100`}
        >
          <TouchableOpacity
            onPress={() => !isProcessing && set_display_modal(null)}
            style={tw`p-2 -ml-2`}
          >
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={tw`ml-2 text-lg font-bold text-gray-800`}>
            Price Survey Entry
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={tw`flex-1`}
        >
          <ScrollView contentContainerStyle={tw`p-6 pb-12 bg-gray-50`}>
            {isProcessing ? (
              <View style={tw`flex-1 justify-center items-center mt-20`}>
                <ActivityIndicator size="large" color="#028543" />
                <Text style={tw`mt-4 text-gray-500 font-bold`}>
                  Uploading Survey...
                </Text>
              </View>
            ) : (
              <View>
                {/* Product Header Info */}
                <View style={tw`mb-6`}>
                  <Text style={tw`text-2xl font-black text-gray-900`}>
                    {selected_item?.product_name}
                  </Text>
                  <View style={tw`flex-row items-center mt-1`}>
                    <Text style={tw`text-gray-600 font-bold text-xs uppercase`}>
                      {selected_item?.brand} - {selected_item?.pack_size}
                    </Text>
                  </View>
                </View>

                {/* Our SRP Card */}
                <View
                  style={tw`mb-8 bg-green-50 p-5 rounded-xl border border-green-200`}
                >
                  <Text
                    style={tw`text-[10px] text-green-700 font-black uppercase mb-1`}
                  >
                    Our Current SRP
                  </Text>
                  <TextInput
                    style={[
                      tw`text-3xl font-black text-green-900 p-0`,
                      {
                        textAlignVertical: "center",
                        includeFontPadding: false,
                      },
                    ]}
                    keyboardType="numeric"
                    value={srp}
                    onChangeText={setSrp}
                    placeholder="0.00"
                  />
                </View>

                <View style={tw`flex-row justify-between items-center mb-4`}>
                  <Text
                    style={tw`text-xs font-black text-gray-400 uppercase tracking-widest`}
                  >
                    Competitor List
                  </Text>
                  <TouchableOpacity
                    onPress={addCompetitor}
                    style={tw`bg-green-700 px-4 py-2 rounded-lg flex-row items-center`}
                  >
                    <Ionicons name="add" size={18} color="white" />
                    <Text style={tw`text-white text-xs font-bold ml-1`}>
                      Add Competitor
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Competitor Cards */}
                {competitors.map((comp, index) => (
                  <View
                    key={comp.id}
                    style={tw`bg-white border border-gray-200 rounded-xl p-5 mb-6`}
                  >
                    <View
                      style={tw`flex-row justify-between items-center mb-5 pb-2 border-b border-gray-50`}
                    >
                      <View style={tw`bg-green-700 px-3 py-1 rounded`}>
                        <Text
                          style={tw`text-[10px] font-black text-white uppercase tracking-wider`}
                        >
                          Competitor {index + 1}
                        </Text>
                      </View>
                      {competitors.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeCompetitor(comp.id)}
                          style={tw`p-1`}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#ef4444"
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    {renderInputField(
                      "Product Name",
                      comp.name,
                      "Brand X 500g",
                      (val) => updateCompetitor(comp.id, "name", val),
                    )}
                    {renderInputField(
                      "Price",
                      comp.price,
                      "0.00",
                      (val) => updateCompetitor(comp.id, "price", val),
                      "numeric",
                    )}
                    {renderInputField(
                      "Promo Price",
                      comp.promo,
                      "e.g. 10% Off",
                      (val) => updateCompetitor(comp.id, "promo", val),
                    )}
                    {renderInputField(
                      "Remarks",
                      comp.remarks,
                      "Notes...",
                      (val) => updateCompetitor(comp.id, "remarks", val),
                      "default",
                      true,
                    )}
                  </View>
                ))}

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSave}
                  style={tw`mt-4 py-5 bg-[#028543] rounded-xl justify-center items-center`}
                >
                  <Text
                    style={tw`text-white font-black text-base uppercase tracking-wider`}
                  >
                    Submit Price Survey
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default Price_Surv_Input;
