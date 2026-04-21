import React, { useState, useRef, useEffect } from "react";
import { db } from "../../../../assets/scripts/firebase";
import { ref, onValue, set, remove, update } from "firebase/database";
import {
  StyleSheet,
  Image,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Animated,
  PanResponder,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import {
  FontAwesome,
  FontAwesome5,
  MaterialIcons,
  AntDesign,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import tw from "twrnc";
import { formate_date } from "../../../../assets/scripts/functions/format_value";
import NetInfo from "@react-native-community/netinfo";

const P10_RTV = ({
  tds_ui_navigation,
  set_tds_ui_navigation,
  general_selected_mcp,
  user_account_data,
}) => {
  const GENERAL_USERNAME = user_account_data.b3_Username;
  const GENERAL_STORE_CODE = general_selected_mcp.a3_STORE_CODE;
  const GENERAL_SELECTED_STORE = general_selected_mcp.a2_SELECTED_STORE;
  const GENERAL_DIVERSION = general_selected_mcp.a4_DIVERSION;
  const GENERAL_MCP_ID = general_selected_mcp.a1_MCP_ID;
  const GENERAL_CHANNEL = general_selected_mcp.a5_CHANNEL;

  const TBL_MCP_PATH = "/DB_TEST/TBL_MCP/DATA";
  const TBL_MANUAL_SELECTION_PROGRESS =
    "/DB_TEST/TBL_MANUAL_SELECTION_PROGRESS/DATA";
  const TBL_RTV_PATH = "/DB_TEST/TBL_RTV/DATA";
  const TBL_RTV_HISTORY_PATH = "/DB_TEST/TBL_RTV_HISTORY/DATA";

  // --- States ---
  const [rtv_list, set_rtv_list] = useState([]);
  const [filtered_rtv_list, set_filtered_rtv_list] = useState([]);
  const [search_query, set_search_query] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // --- Modal Form States ---
  const [rtvNumber, setRtvNumber] = useState("");
  const [selectedReason, setSelectedReason] = useState("Defective"); // Defective, Incorrect Item, Expired, Other
  const [otherReason, setOtherReason] = useState("");

  // --- Sidebar Logic ---
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-300)).current;

  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.timing(sidebarAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    Animated.timing(sidebarAnim, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dx > 50 && !isSidebarOpen) openSidebar();
        else if (gestureState.dx < -50 && isSidebarOpen) closeSidebar();
      },
    }),
  ).current;

  // --- Firebase Data Fetching ---
  useEffect(() => {
    const rtvRef = ref(
      db,
      `${TBL_RTV_PATH}/${GENERAL_USERNAME}/${GENERAL_STORE_CODE}`,
    );
    const unsubscribe = onValue(rtvRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        set_rtv_list(list);
      } else {
        set_rtv_list([]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [GENERAL_STORE_CODE]);

  // --- Search Filtering ---
  useEffect(() => {
    const filtered = rtv_list.filter(
      (item) =>
        item.rtv_number.toLowerCase().includes(search_query.toLowerCase()) ||
        item.reason.toLowerCase().includes(search_query.toLowerCase()),
    );
    set_filtered_rtv_list(filtered);
  }, [search_query, rtv_list]);

  // --- Delete Function ---
  const handleDeleteRTV = (item) => {
    Alert.alert(
      "Confirm Delete",
      `Delete RTV #${item.rtv_number}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const timestamp = item.id;
              const combined_id = `${GENERAL_USERNAME}_${GENERAL_STORE_CODE}_${timestamp}`;
              await remove(
                ref(
                  db,
                  `${TBL_RTV_PATH}/${GENERAL_USERNAME}/${GENERAL_STORE_CODE}/${timestamp}`,
                ),
              );
              await remove(ref(db, `${TBL_RTV_HISTORY_PATH}/${combined_id}`));
            } catch (error) {
              Alert.alert("Error", "Failed to delete: " + error.message);
            }
          },
        },
      ],
    );
  };

  // --- Save Function (Revised Logic) ---
  const handleSaveRTV = async () => {
    if (!rtvNumber) return Alert.alert("Required", "Please enter RTV Number");
    if (selectedReason === "Other" && !otherReason)
      return Alert.alert("Required", "Please specify the reason");

    const timestamp = Date.now();
    const datePrepared = formate_date(new Date(), "mm/dd/yyyy");
    const combined_id = `${GENERAL_USERNAME}_${GENERAL_STORE_CODE}_${timestamp}`;

    // Determine the final reason string to store
    const finalReason =
      selectedReason === "Other" ? otherReason : selectedReason;

    const rtvData = {
      tds_code: GENERAL_USERNAME,
      store_code: GENERAL_STORE_CODE,
      return_to_vendor: "YES",
      date_prepared: datePrepared,
      rtv_number: rtvNumber,
      reason: finalReason, // Unified field
    };

    try {
      await set(
        ref(
          db,
          `${TBL_RTV_PATH}/${GENERAL_USERNAME}/${GENERAL_STORE_CODE}/${timestamp}`,
        ),
        rtvData,
      );
      await set(ref(db, `${TBL_RTV_HISTORY_PATH}/${combined_id}`), rtvData);

      setModalVisible(false);
      setRtvNumber("");
      setOtherReason("");
      setSelectedReason("Defective");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // --- Modal Helper Component ---
  const ReasonOption = ({ label, value }) => (
    <TouchableOpacity
      onPress={() => setSelectedReason(value)}
      style={tw`flex-row items-center py-4 border-b border-gray-50`}
    >
      <View
        style={tw`h-5 w-5 rounded-full border-2 border-[#028543] items-center justify-center mr-3`}
      >
        {selectedReason === value && (
          <View style={tw`h-2.5 w-2.5 rounded-full bg-[#028543]`} />
        )}
      </View>
      <Text
        style={tw`text-[4] ${selectedReason === value ? "text-[#028543] font-bold" : "text-gray-600"}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const NavItem = ({ icon, label, navId, currentNav, onPress }) => {
    const isActive = currentNav === navId;
    return (
      <TouchableOpacity
        style={tw`w-full flex-row justify-start items-center py-2 px-4 mb-2 rounded-xl ${
          isActive ? "bg-[#028543] shadow-sm" : "bg-transparent"
        }`}
        onPress={onPress}
      >
        <View style={tw`w-10 h-10 justify-center items-center`}>
          <MaterialCommunityIcons
            name={icon}
            size={26}
            color={isActive ? "#FFFFFF" : "#B9B9B9"}
          />
        </View>
        <Text
          style={tw`ml-4 text-[3.8] font-bold ${
            isActive ? "text-[#FFFFFF]" : "text-[#B9B9B9]"
          }`}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  // + AS COMPLETION
  const [rtv_status, set_rtv_status] = useState(0);

  // Helper para makuha ang tamang Firebase Path
  const getPSPath = () => {
    return GENERAL_DIVERSION !== "NOT_LISTED"
      ? `${TBL_MCP_PATH}/${GENERAL_USERNAME}/${GENERAL_MCP_ID}`
      : `${TBL_MANUAL_SELECTION_PROGRESS}/${GENERAL_USERNAME}/${GENERAL_STORE_CODE}`;
  };

  // Simplified Listener
  const listenPSStatus = () => {
    onValue(ref(db, getPSPath()), (snapshot) => {
      const data = snapshot.val();
      const date_now = formate_date(new Date(), "mm/dd/yyyy");

      if (data) {
        // Kung manual, i-check ang date. Kung MCP, direct status.
        const status =
          GENERAL_DIVERSION === "NOT_LISTED" &&
          data.z_rtv_date_updated !== date_now
            ? 0
            : data.z_rtv_status || 0;
        set_rtv_status(status);
      } else {
        set_rtv_status(0);
      }
    });
  };

  useEffect(() => {
    listenPSStatus();
  }, []);

  const updatePSCompletion = async (isDone = true) => {
    const dateStr = formate_date(new Date(), "mm/dd/yyyy");
    const statusValue = isDone ? 1 : 0;

    // Dynamic payload base sa diversion type
    const payload =
      GENERAL_DIVERSION !== "NOT_LISTED"
        ? { z_rtv_status: statusValue, ActualDateVisited: dateStr }
        : {
            a1_ID: GENERAL_STORE_CODE,
            z_rtv_status: statusValue,
            z_rtv_date_updated: dateStr,
          };

    try {
      await update(ref(db, getPSPath()), payload);
    } catch (error) {
      console.error("Update failed:", error);
      Alert.alert("⚠️ Error", "Check your internet connection.");
    }
  };

  const handle_check_connection = () => {
    NetInfo.fetch().then((state) => {
      if (state.isConnected && state.isInternetReachable) {
        updatePSCompletion(true); // "true" means "done"
      } else {
        Alert.alert("No Connection", "You're not connected to the internet.");
      }
    });
  };
  // - AS COMPLETION

  // RETURN ORIGIN
  return (
    <React.Fragment>
      <View style={tw`h-full w-full justify-start items-center bg-[#fff]`}>
        {/* Sidebar */}
        <Animated.View
          style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }] }]}
          {...panResponder.panHandlers}
        >
          <View
            style={tw`h-[18] mt-[20] pr-[10] flex-row justify-between items-center`}
          >
            <Image
              source={require("../../../../assets/images/ui/benby-logo.png")}
              style={[tw`h-full ml-[10] w-[24]`, { tintColor: "green" }]}
              resizeMode="contain"
            />
            <TouchableOpacity onPress={closeSidebar}>
              <FontAwesome5 name="angle-left" size={42} color={"#028543"} />
            </TouchableOpacity>
          </View>
          <Text
            style={[styles.sidebarText, tw`mt-[10] text-[4.2] text-[#028543]`]}
          >
            STORECODE : {GENERAL_STORE_CODE}
          </Text>
          <Text
            style={[styles.sidebarText, tw`mt-[10] text-[4.2] text-[#028543]`]}
          >
            TDS ID : {GENERAL_USERNAME}
          </Text>
          <ScrollView style={tw`mt-8`} showsVerticalScrollIndicator={false}>
            <NavItem
              icon="storefront-outline"
              label="ON-SHELF AVAILABILITY"
              navId="osa"
              currentNav={tds_ui_navigation}
              onPress={() => set_tds_ui_navigation("osa")}
            />
            <NavItem
              icon="account-group-outline"
              label="MERCH DEPLOYMENT"
              navId="md"
              currentNav={tds_ui_navigation}
              onPress={() => set_tds_ui_navigation("md")}
            />
            <NavItem
              icon="calendar-text-outline"
              label="EXECUTION PLANNER"
              navId="ep"
              currentNav={tds_ui_navigation}
              onPress={() => set_tds_ui_navigation("ep")}
            />
            <NavItem
              icon="clipboard-check-outline"
              label="TRADE RENTALS"
              navId="trade_rental"
              currentNav={tds_ui_navigation}
              onPress={() => set_tds_ui_navigation("trade_rental")}
            />
            <NavItem
              icon="clipboard-check-outline"
              label="AUDIT SURVEY"
              navId="audit_survey"
              currentNav={tds_ui_navigation}
              onPress={() => set_tds_ui_navigation("audit_survey")}
            />
            <NavItem
              icon="package-variant"
              label="SHARE OF SHELF"
              navId="share_of_shelf"
              currentNav={tds_ui_navigation}
              onPress={() => set_tds_ui_navigation("share_of_shelf")}
            />
            <NavItem
              icon="cash-multiple"
              label="PRICE SURVEY"
              navId="price_survey"
              currentNav={tds_ui_navigation}
              onPress={() => set_tds_ui_navigation("price_survey")}
            />
            <NavItem
              icon="truck-delivery-outline"
              label="RETURN TO VENDOR"
              navId="rtv"
              currentNav={tds_ui_navigation}
              onPress={() => set_tds_ui_navigation("rtv")}
            />
            <NavItem
              icon="clipboard-list-outline"
              label="NERM INVENTORY"
              navId="nerm"
              currentNav={tds_ui_navigation}
              onPress={() => set_tds_ui_navigation("nerm")}
            />
          </ScrollView>
        </Animated.View>

        {/* Header */}
        <View
          style={tw`bg-[#028543] w-full pt-4 pb-4 px-2 absolute top-0 rounded-b-[30px] shadow-lg`}
        >
          <View style={tw`w-full flex-row justify-between items-center px-4`}>
            <TouchableOpacity
              style={tw`w-12 h-12 justify-center items-center bg-white/10 rounded-xl`}
              onPress={openSidebar}
            >
              <MaterialIcons name="menu" size={28} color="#FFF" />
            </TouchableOpacity>
            <View style={tw`flex-1 justify-center items-center px-2`}>
              <Text
                style={tw`text-white text-[4] font-black tracking-wide text-center uppercase`}
              >
                RETURN TO VENDOR
              </Text>
            </View>
            <TouchableOpacity
              style={tw`w-12 h-12 justify-center items-center bg-white/10 rounded-xl`}
              onPress={() => set_tds_ui_navigation("main_page")}
            >
              <FontAwesome name="home" size={26} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Store Info & Search */}
        <View
          style={tw`w-full flex justify-center items-center mt-[100] px-[20] border-b-[0.7] border-b-[#DBDBDB]`}
        >
          <View style={tw`w-full h-[14] flex justify-center items-center`}>
            <Text style={tw`text-[4.2] text-[#028543] text-center font-bold`}>
              {GENERAL_STORE_CODE} - {GENERAL_SELECTED_STORE}
            </Text>
          </View>
          <View style={tw`w-full h-[13] justify-center items-center mb-[10]`}>
            <View
              style={tw`h-[10] pl-[15] flex flex-row justify-center bg-[#fff] rounded-lg border-[0.5] border-[#028543] w-full`}
            >
              <TextInput
                placeholder="Search RTV Number..."
                placeholderTextColor={`gray`}
                style={tw`flex-1 text-[4.4] p-[0]`}
                onChangeText={set_search_query}
              />
              <View style={tw`justify-center items-center w-[12] pb-[2]`}>
                <FontAwesome name="search" size={20} color={"#028543"} />
              </View>
            </View>
          </View>
        </View>

        {/* RTV List */}
        <View style={tw`w-full flex-1`}>
          {isLoading ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <ActivityIndicator size="large" color="#028543" />
            </View>
          ) : (
            <FlatList
              data={filtered_rtv_list}
              keyExtractor={(item) => item.id}
              contentContainerStyle={tw`pb-32 pt-4 px-4`}
              renderItem={({ item }) => (
                <View
                  style={tw`bg-white rounded-xl mb-4 border border-gray-300 overflow-hidden`}
                >
                  <View
                    style={tw`bg-gray-50 px-4 py-2 flex-row justify-between items-center border-b border-gray-100`}
                  >
                    <View style={tw`flex-col justify-start items-start`}>
                      <Text style={tw`text-[2.8] text-gray-400 uppercase mt-1`}>
                        RTV NUMBER
                      </Text>
                      <Text
                        style={tw`text-[4.5] font-extrabold text-[#e93636] mt-[-1]`}
                      >
                        {item.rtv_number}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteRTV(item)}
                      style={tw`p-1`}
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={22}
                        color="#e93636"
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={tw`p-4 flex-row justify-between items-center`}>
                    <View style={tw`flex-1`}>
                      <Text
                        style={tw`text-[2.8] text-gray-400 uppercase font-bold tracking-tighter`}
                      >
                        RETURN REASON
                      </Text>
                      <Text
                        style={tw`text-[4.2] font-extrabold text-[#e93636] mt-0.5`}
                      >
                        {item.reason}
                      </Text>
                      <View style={tw`flex-row items-center mt-2`}>
                        <MaterialIcons
                          name="event-note"
                          size={14}
                          color="#9CA3AF"
                        />
                        <Text
                          style={tw`ml-1 text-[3.2] text-gray-400 font-medium`}
                        >
                          {item.date_prepared}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={tw`h-12 w-12 rounded-xl bg-red-100 items-center justify-center border border-red-600`}
                    >
                      <MaterialIcons
                        name={
                          item.reason === "Defective"
                            ? "error-outline"
                            : item.reason === "Expired"
                              ? "update"
                              : "inventory-2"
                        }
                        size={24}
                        color="#e93636"
                      />
                    </View>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text
                  style={tw`text-center mt-20 text-gray-300 font-bold uppercase`}
                >
                  No RTV Records Found
                </Text>
              }
            />
          )}
        </View>

        {/* Footer */}
        <View
          style={tw`w-full py-[10] justify-center items-center border-t-[0.7] border-t-[#DBDBDB]`}
        >
          <View
            style={tw`flex flex-row justify-center items-center h-[12] px-[25]`}
          >
            {rtv_status === 0 ? (
              <TouchableOpacity
                style={tw`flex-1 w-full h-full justify-center items-center bg-[#FFF] border-[0.4] border-[#028543] rounded-lg`}
                onPress={handle_check_connection}
              >
                <Text
                  style={tw`text-[4.2] text-[#028543] font-bold tracking-[0.4] text-center`}
                >
                  SAVE
                </Text>
              </TouchableOpacity>
            ) : (
              /* State 1: Show Checked/Success View */
              <View
                style={tw`flex-1 w-full h-full justify-center items-center bg-[#028543] border-[0.4] border-[#028543] rounded-lg`}
              >
                <FontAwesome name="check" size={32} color={"#fff"} />
              </View>
            )}
          </View>
        </View>

        {/* FAB */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[
            tw`absolute bottom-25 right-7 w-14 h-14 rounded-full bg-[#028543] justify-center items-center shadow-lg`,
            { zIndex: 10 },
          ]}
        >
          <AntDesign name="plus" size={24} color="white" />
        </TouchableOpacity>

        {/* Add RTV Modal */}
        <Modal visible={modalVisible} animationType="fade" transparent={true}>
          <View style={tw`flex-1 justify-end bg-[rgba(0,0,0,0.5)]`}>
            <View style={tw`bg-white rounded-t-3xl p-6 h-[75%]`}>
              <View style={tw`flex-row justify-between items-center mb-6`}>
                <Text style={tw`text-[5] font-bold text-[#028543]`}>
                  New Return Entry
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <MaterialIcons name="close" size={28} color="gray" />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text
                  style={tw`text-[3.2] text-gray-400 font-bold uppercase mb-1`}
                >
                  RTV Number
                </Text>
                <TextInput
                  value={rtvNumber}
                  onChangeText={setRtvNumber}
                  placeholder="Enter Ref Number"
                  style={tw`border border-gray-200 rounded-xl p-4 mb-6 text-[4] bg-gray-50`}
                />

                <Text
                  style={tw`text-[3.2] text-gray-400 font-bold uppercase mb-1`}
                >
                  Select Reason
                </Text>
                <ReasonOption label="Defective" value="Defective" />
                <ReasonOption label="Incorrect Item" value="Incorrect Item" />
                <ReasonOption label="Expired" value="Expired" />
                <ReasonOption label="Other Reason" value="Other" />

                {selectedReason === "Other" && (
                  <TextInput
                    value={otherReason}
                    onChangeText={setOtherReason}
                    placeholder="Type reason here..."
                    style={tw`border-b-2 border-[#028543] p-2 mt-2 text-[4]`}
                  />
                )}

                <TouchableOpacity
                  onPress={handleSaveRTV}
                  style={tw`bg-[#028543] p-4 rounded-xl mt-10 items-center justify-center`}
                >
                  <Text style={tw`text-white font-bold text-base`}>
                    Submit RTV
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
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
});

export default P10_RTV;
