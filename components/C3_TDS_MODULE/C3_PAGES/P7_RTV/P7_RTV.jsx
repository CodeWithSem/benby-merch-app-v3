import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import tw from "twrnc";

// --- DUMMY DATA ---
const DUMMY_PRODUCTS = [
  { id: "1", name: "Premium Milk 1L", sku: "SKU-001", brand: "Nestle" },
  { id: "2", name: "Whole Grain Bread", sku: "SKU-002", brand: "Gardenia" },
  { id: "3", name: "Organic Eggs 12s", sku: "SKU-003", brand: "FarmFresh" },
  { id: "4", name: "Salted Butter 225g", sku: "SKU-004", brand: "Anchor" },
  { id: "5", name: "Instant Coffee 200g", sku: "SKU-005", brand: "Nescafe" },
];

const RETURN_REASONS = [
  "Expired",
  "Damaged",
  "Near Expiry",
  "Recall",
  "Slow Move",
];

const P7_RTV = ({
  tds_ui_navigation,
  set_tds_ui_navigation,
  general_selected_mcp,
  user_account_data,
}) => {
  const GENERAL_USERNAME = user_account_data.b3_Username;
  const GENERAL_MCP_ID = general_selected_mcp.a1_MCP_ID;
  const GENERAL_SELECTED_STORE = general_selected_mcp.a2_SELECTED_STORE;
  const GENERAL_STORE_CODE = general_selected_mcp.a3_STORE_CODE;
  const GENERAL_DIVERSION = general_selected_mcp.a4_DIVERSION;
  const GENERAL_CHANNEL = general_selected_mcp.a5_CHANNEL;
  const [searchQuery, setSearchQuery] = useState("");
  const [returnList, setReturnList] = useState([]);
  const [reasonModal, setReasonModal] = useState({
    visible: false,
    itemId: null,
  });

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleAddToReturn = (product) => {
    const existing = returnList.find((item) => item.id === product.id);
    if (existing) {
      Alert.alert("Already Added", "This item is already in your return list.");
      return;
    }

    const newItem = {
      ...product,
      returnQty: 1,
      reason: "Expired",
    };
    setReturnList([...returnList, newItem]);
    setSearchQuery("");
  };

  const updateItem = (id, field, value) => {
    setReturnList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const removeItem = (id) => {
    setReturnList(returnList.filter((item) => item.id !== id));
  };

  const filteredProducts = DUMMY_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* --- HEADER SECTION --- */}
      <View style={tw`bg-white px-5 pt-12 pb-5 shadow-sm`}>
        <View style={tw`flex-row justify-between items-center`}>
          <TouchableOpacity onPress={() => set_tds_ui_navigation("main_page")}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={28}
              color="#1F2937"
            />
          </TouchableOpacity>
          <View style={tw`items-end`}>
            <Text style={tw`text-[10px] font-bold text-green-600 uppercase`}>
              {currentDate}
            </Text>
            <Text style={tw`text-gray-800 font-bold`}>
              {user_account_data?.full_name || "Merchandiser"}
            </Text>
          </View>
        </View>

        <View style={tw`mt-4`}>
          <Text style={tw`text-2xl font-black text-gray-800`}>
            Return to Vendor
          </Text>
          <View style={tw`flex-row items-center mt-1`}>
            <MaterialCommunityIcons
              name="storefront"
              size={14}
              color="#6B7280"
            />
            <Text style={tw`text-gray-500 text-xs ml-1 font-medium`}>
              {GENERAL_SELECTED_STORE || "No Store Selected"}
            </Text>
          </View>
        </View>
      </View>

      {/* --- SEARCH BOX --- */}
      <View style={tw`p-4 z-50`}>
        <View
          style={tw`flex-row items-center bg-white rounded-2xl px-4 border border-gray-200 shadow-sm`}
        >
          <MaterialCommunityIcons name="magnify" size={22} color="#028543" />
          <TextInput
            style={tw`flex-1 h-14 ml-3 text-gray-700 font-medium`}
            placeholder="Search SKU or Product Name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          )}
        </View>

        {searchQuery.length > 0 && (
          <View
            style={tw`absolute top-20 left-4 right-4 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden`}
          >
            {filteredProducts.length > 0 ? (
              filteredProducts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleAddToReturn(item)}
                  style={tw`p-4 border-b border-gray-50 flex-row justify-between items-center`}
                >
                  <View>
                    <Text style={tw`font-bold text-gray-800`}>{item.name}</Text>
                    <Text style={tw`text-[10px] text-gray-400 font-bold`}>
                      {item.sku} • {item.brand}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="plus-box"
                    size={24}
                    color="#028543"
                  />
                </TouchableOpacity>
              ))
            ) : (
              <View style={tw`p-6 items-center`}>
                <Text style={tw`text-gray-400 italic`}>
                  No matching products found
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* --- SELECTED ITEMS LIST --- */}
      <View style={tw`flex-1 px-4`}>
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <Text
            style={tw`text-[11px] font-black text-gray-400 uppercase tracking-widest`}
          >
            Pull-out List ({returnList.length})
          </Text>
        </View>

        <FlatList
          data={returnList}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View
              style={tw`items-center justify-center mt-12 bg-white rounded-3xl p-10 border border-dashed border-gray-200`}
            >
              <View
                style={tw`w-16 h-16 bg-gray-50 rounded-full items-center justify-center mb-4`}
              >
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={40}
                  color="#D1D5DB"
                />
              </View>
              <Text style={tw`text-gray-400 font-bold`}>
                List is currently empty
              </Text>
              <Text style={tw`text-gray-300 text-xs text-center mt-1`}>
                Add items that need to be returned to the vendor.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={tw`bg-white rounded-3xl p-5 mb-4 border border-gray-100 shadow-sm`}
            >
              <View style={tw`flex-row justify-between items-start mb-4`}>
                <View style={tw`flex-1`}>
                  <Text
                    style={tw`text-xs font-black text-green-700 mb-0.5 uppercase`}
                  >
                    {item.brand}
                  </Text>
                  <Text style={tw`text-base font-bold text-gray-800`}>
                    {item.name}
                  </Text>
                  <Text style={tw`text-[10px] text-gray-400 font-bold`}>
                    {item.sku}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeItem(item.id)}
                  style={tw`bg-red-50 p-2 rounded-full`}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={18}
                    color="#EF4444"
                  />
                </TouchableOpacity>
              </View>

              <View style={tw`flex-row items-center gap-x-3`}>
                <View style={tw`flex-1`}>
                  <Text
                    style={tw`text-[10px] font-black text-gray-400 mb-1 uppercase`}
                  >
                    Qty
                  </Text>
                  <View
                    style={tw`flex-row items-center bg-gray-50 rounded-2xl p-1 border border-gray-100`}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        updateItem(
                          item.id,
                          "returnQty",
                          Math.max(1, item.returnQty - 1),
                        )
                      }
                      style={tw`w-8 h-8 items-center justify-center bg-white rounded-xl shadow-sm`}
                    >
                      <MaterialCommunityIcons
                        name="minus"
                        size={14}
                        color="#028543"
                      />
                    </TouchableOpacity>
                    <Text
                      style={tw`flex-1 text-center font-black text-gray-800`}
                    >
                      {item.returnQty}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        updateItem(item.id, "returnQty", item.returnQty + 1)
                      }
                      style={tw`w-8 h-8 items-center justify-center bg-white rounded-xl shadow-sm`}
                    >
                      <MaterialCommunityIcons
                        name="plus"
                        size={14}
                        color="#028543"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    setReasonModal({ visible: true, itemId: item.id })
                  }
                  style={tw`flex-1.5`}
                >
                  <Text
                    style={tw`text-[10px] font-black text-gray-400 mb-1 uppercase`}
                  >
                    Reason
                  </Text>
                  <View
                    style={tw`flex-row items-center justify-between bg-gray-50 rounded-2xl h-10 px-4 border border-gray-100`}
                  >
                    <Text style={tw`text-xs font-bold text-gray-600`}>
                      {item.reason}
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={16}
                      color="#9CA3AF"
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>

      {/* --- FOOTER ACTION --- */}
      <View style={tw`bg-white p-6 rounded-t-[40px] shadow-2xl`}>
        <View style={tw`flex-row justify-between items-center mb-5`}>
          <View>
            <Text
              style={tw`text-gray-400 text-[10px] font-black uppercase tracking-widest`}
            >
              Total Summary
            </Text>
            <Text style={tw`text-xl font-black text-gray-800`}>
              {returnList.reduce((acc, curr) => acc + curr.returnQty, 0)}{" "}
              <Text style={tw`text-sm font-bold text-gray-500`}>Units</Text>
            </Text>
          </View>
          <View style={tw`bg-green-100 px-4 py-2 rounded-2xl`}>
            <Text style={tw`text-green-700 font-bold text-xs`}>
              {returnList.length} SKUs
            </Text>
          </View>
        </View>

        <TouchableOpacity
          disabled={returnList.length === 0}
          style={tw`w-full ${returnList.length === 0 ? "bg-gray-200" : "bg-[#028543]"} py-5 rounded-2xl items-center shadow-lg`}
          onPress={() => {
            Alert.alert(
              "Confirm Submission",
              "Finalize this pull-out request?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Confirm",
                  onPress: () => set_tds_ui_navigation("main_page"),
                },
              ],
            );
          }}
        >
          <Text
            style={tw`text-white font-black text-lg tracking-widest uppercase`}
          >
            Confirm Return
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- REASON SELECTION MODAL --- */}
      <Modal visible={reasonModal.visible} transparent animationType="fade">
        <View style={tw`flex-1 justify-center bg-black/50 px-6`}>
          <View style={tw`bg-white rounded-3xl p-6`}>
            <Text style={tw`text-lg font-black text-gray-800 mb-4`}>
              Select Reason
            </Text>
            {RETURN_REASONS.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => {
                  updateItem(reasonModal.itemId, "reason", r);
                  setReasonModal({ visible: false, itemId: null });
                }}
                style={tw`py-4 border-b border-gray-50 flex-row justify-between items-center`}
              >
                <Text style={tw`text-gray-700 font-medium`}>{r}</Text>
                {/* Visual indicator for which reason is already selected could be added here */}
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={18}
                  color="#E5E7EB"
                />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setReasonModal({ visible: false, itemId: null })}
              style={tw`mt-4 py-3 items-center`}
            >
              <Text style={tw`text-red-500 font-bold`}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header_bg: {
    width: "100%",
    zIndex: 2,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 300,
    backgroundColor: "#FFF",
    padding: 15,
    zIndex: 4,
    borderRightWidth: 2,
    borderColor: "#f1f1f1",
  },
  sidebarText: {
    fontSize: 20,
    color: "white",
  },
  closeButtonText: {
    fontSize: 18,
    color: "red",
    marginTop: 20,
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
});

export default P7_RTV;
