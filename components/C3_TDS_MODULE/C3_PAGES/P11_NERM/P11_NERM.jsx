import React, { Dispatch, useEffect, useState, useRef } from "react";
import { db } from "../../../../assets/scripts/firebase";
import {
  set,
  get,
  ref,
  onValue,
  update,
  query,
  remove,
} from "firebase/database";
import {
  StyleSheet,
  Image,
  ImageBackground,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  FlatList,
  TextInput,
  Animated,
  PanResponder,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal as ModalReact,
} from "react-native";
import tw from "twrnc";
import { Modal } from "../../../../assets/elements/Modal";
import {
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { formate_date } from "../../../../assets/scripts/functions/format_value";
import NetInfo from "@react-native-community/netinfo";
import DateTimePicker from "@react-native-community/datetimepicker";

const P11_NERM = ({
  tds_ui_navigation,
  set_tds_ui_navigation,
  general_selected_mcp,
  user_account_data,
}) => {
  const date_now = new Date();
  const GENERAL_USERNAME = user_account_data.b3_Username;
  const GENERAL_MCP_ID = general_selected_mcp.a1_MCP_ID;
  const GENERAL_SELECTED_STORE = general_selected_mcp.a2_SELECTED_STORE;
  const GENERAL_STORE_CODE = general_selected_mcp.a3_STORE_CODE;
  const GENERAL_DIVERSION = general_selected_mcp.a4_DIVERSION;
  const GENERAL_CHANNEL = general_selected_mcp.a5_CHANNEL.toUpperCase();
  const GENERAL_TAGGING = user_account_data.i1_Covered.toUpperCase();
  const GENERAL_POSITION = user_account_data.b6_Type;

  const TBL_MCP_PATH = "/DB_TEST/TBL_MCP/DATA";
  const TBL_MANUAL_SELECTION_PROGRESS =
    "/DB_TEST/TBL_MANUAL_SELECTION_PROGRESS/DATA";
  const TBL_OSA_PATH = `/DB_TEST/TBL_NERM/DATA/${formate_date(
    date_now,
    "mm-dd-yyyy",
  )}/${GENERAL_USERNAME}/${GENERAL_STORE_CODE}`;

  // const TBL_NERM_HISTORY_PATH = `/DB_TEST/TBL_NERM_HISTORY/DATA/${GENERAL_USERNAME}/${GENERAL_STORE_CODE}`;

  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [inventoryEntries, setInventoryEntries] = useState([
    // {
    //   id: 1,
    //   cases: "5",
    //   innerBox: "2",
    //   pieces: "10",
    //   expiry: new Date(),
    //   inventory: new Date(),
    // },
  ]);

  // + [Script] Sidebar
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
        if (gestureState.dx > 50 && !isSidebarOpen) {
          openSidebar();
        } else if (gestureState.dx < -50 && isSidebarOpen) {
          closeSidebar();
        }
      },
    }),
  ).current;
  // - [Script] Sidebar

  const [modalVisible, setModalVisible] = useState(false);

  const [selectedSKU, setSelectedSKU] = useState(null);
  const [casesInput, setCasesInput] = useState("");
  const [innerBoxInput, setInnerBoxInput] = useState("");
  const [piecesInput, setPiecesInput] = useState("");

  // States para sa Values
  const [expiry_date, set_expiry_date] = useState(new Date());
  const [inventory_date, set_inventory_date] = useState(new Date());

  // States para sa Visibility ng Picker
  const [is_expiry_picker_show, set_is_expiry_picker_show] = useState(false);
  const [is_inventory_picker_show, set_is_inventory_picker_show] =
    useState(false);

  // Handlers
  const expiry_date_on_change = (event, selectedDate) => {
    set_is_expiry_picker_show(false); // Close picker
    if (selectedDate) set_expiry_date(selectedDate);
  };

  const inventory_date_on_change = (event, selectedDate) => {
    set_is_inventory_picker_show(false); // Close picker
    if (selectedDate) set_inventory_date(selectedDate);
  };

  const [osa_completion_status, set_osa_completion_status] = useState(0);
  const [osa_completion_status_manual, set_osa_completion_status_manual] =
    useState(0);
  const [selected_osa, set_selected_osa] = useState({
    product_name: "",
    a1_Matcode: "",
    a2_Storecode: "",
    a3_ActionID: 0,
    a7_Pcs: "",
    a8_Cases: "",
    a9_InnerBox: "",
    b2_Remarks: 0,
  });

  const osa_critical_remarks = [
    {
      a1_ID: 1,
      b1_DESC: "WITH FLOATING  INVENTORY - FOR HO CORRECTION",
    },
    {
      a1_ID: 2,
      b1_DESC: "WITH FLOATING  INVENTORY - STORE SAS",
    },
    {
      a1_ID: 3,
      b1_DESC: "ADJUST MAX CAP - FOR HO CORRECTION",
    },
    {
      a1_ID: 4,
      b1_DESC: "ADJUST MAX CAP - STORE SAS",
    },
    {
      a1_ID: 5,
      b1_DESC: "WHOLESALE ORDER",
    },
  ];

  const osa_overstock_remarks = [
    {
      a1_ID: 1,
      b1_DESC: "REQUEST FOR HO MOVE-OUT",
    },
    {
      a1_ID: 2,
      b1_DESC: "WITH MOVE-OUT",
    },
    {
      a1_ID: 3,
      b1_DESC: "OVER ALLOCATION FROM PROMO",
    },
    {
      a1_ID: 4,
      b1_DESC: "HOLD PO/TRANSFER TEMPORARILY",
    },
  ];

  function get_osa_remarks_by_id(id) {
    if (selected_osa.a3_ActionID === 2) {
      const remark = osa_critical_remarks.find((item) => item.a1_ID === id);
      return remark ? remark.b1_DESC : undefined;
    } else if (selected_osa.a3_ActionID === 3) {
      const remark = osa_overstock_remarks.find((item) => item.a1_ID === id);
      return remark ? remark.b1_DESC : undefined;
    }
  }

  const [is_template_loading, set_is_template_loading] = useState(false);
  const [is_save_modal_open, set_is_save_modal_open] = useState(false);
  const [is_error_modal_open, set_is_error_modal_open] = useState(false);
  const [is_osa_remarks_modal_open, set_is_osa_remarks_modal_open] =
    useState(false);

  const [is_tara_overview_modal_open, set_is_tara_overview_modal_open] =
    useState(false);

  const [is_state_qty_modal_open, set_is_state_qty_modal_open] =
    useState(false);
  const [is_select_brand_modal_open, set_is_select_brand_modal_open] =
    useState(false);
  const [selected_brand, set_selected_brand] = useState({
    a1_ID: 0,
    b1_DESC: "Choose Brand",
  });
  const [is_select_category_modal_open, set_is_select_category_modal_open] =
    useState(false);
  const [selected_category, set_selected_category] = useState({
    a1_ID: 0,
    b1_DESC: "Choose Category",
  });

  // + [Fetch Data] SKU
  const [osa_product_data, set_osa_product_data] = useState([]);
  const [search_query, set_search_query] = useState("");
  const [raw_osa_product_data, set_raw_osa_product_data] = useState([]);
  const [null_osa_list, set_null_osa_list] = useState([]);

  const fetch_data_osa_product_data = async () => {
    try {
      // 1. Fetch main product data
      const db1_ref = ref(
        db,
        `/DB_TEST/TBL_MCL_NERM/DATA/${GENERAL_CHANNEL}/${GENERAL_TAGGING}/${GENERAL_POSITION}`,
      );
      const db1_snapshot = await get(db1_ref);
      const db1_data = db1_snapshot.val() || {};

      // 2. Fetch OSA path data (db2 logic removed as requested)
      const db3_ref = query(ref(db, `${TBL_OSA_PATH}`));
      const db3_snapshot = await get(db3_ref);
      const db3_data = db3_snapshot.val() || {};

      const today = formate_date(date_now, "mm/dd/yyyy");

      // 3. Merging logic
      const merged_data = Object.values(db1_data).map((item) => {
        const matched_item_db3 = db3_data[item.a1_Matcode] || {};

        // Check logic updated to only reference db3 (OSA data)
        if (matched_item_db3.a5_Dateupdated === today) {
          return {
            ...item,
            ...matched_item_db3,
          };
        }

        return item;
      });

      set_null_osa_list(merged_data);
      set_raw_osa_product_data(merged_data);
    } catch (error) {
      console.log("Error. Cannot fetch data: " + error);
    }
  };

  const verify_raw_osa_count = (count) => {
    if (count == 0) {
      Alert.alert(
        "Error",
        `There are no MCL available.`,
        [
          {
            text: "OK",
            style: "cancel",
          },
        ],
        { cancelable: true },
      );
    } else {
      set_is_save_modal_open(true);
    }
  };

  useEffect(() => {
    fetch_data_osa_product_data();
  }, []);

  const [isLoading, setIsLoading] = useState(false);

  // --- EFFECT: FETCH DATA MULA SA REALTIME DATABASE ---
  useEffect(() => {
    if (!selectedSKU?.a1_Matcode || !modalVisible) return;

    setIsLoading(true);
    // Path para sa pakikinig sa data ng specific matcode
    const FETCH_PATH = `/DB_TEST/TBL_NERM/HISTORY/${GENERAL_USERNAME}/${GENERAL_STORE_CODE}/${selectedSKU.a1_Matcode}`;
    const dbRef = ref(db, FETCH_PATH);

    // Makinig sa data gamit ang onValue (Realtime Changes)
    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Dahil ang data sa Firebase ay object na ang key ay unix timestamp ({ "17158...": {...} })
          // I-convert natin ito sa isang Array para ma-map natin sa UI
          const formattedList = Object.keys(data).map((key) => ({
            id: key, // unix timestamp
            ...data[key],
          }));

          // I-sort ang entries para ang pinakabagong entry ang nasa itaas
          formattedList.sort((a, b) => Number(b.unix) - Number(a.unix));

          setInventoryEntries(formattedList);
        } else {
          setInventoryEntries([]); // Walang data na nahanap
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Firebase Fetch Error: ", error);
        setIsLoading(false);
      },
    );

    // Linisin ang listener kapag nag-unmount o nagbago ang Matcode
    return () => unsubscribe();
  }, [selectedSKU?.a1_Matcode, modalVisible]);

  useEffect(() => {
    const filtered = raw_osa_product_data.filter((item) => {
      const search_by_text = item.a5_SKUName
        ?.toLowerCase()
        .includes(search_query.toLowerCase());

      const search_by_brand = () => {
        if (
          selected_brand.b1_DESC === "ALL" ||
          selected_brand.b1_DESC === "Choose Brand"
        ) {
          return true;
        }
        return item.a3_Brand?.toString().includes(selected_brand.b1_DESC);
      };

      const search_by_category = () => {
        if (
          selected_category.b1_DESC === "ALL" ||
          selected_category.b1_DESC === "Choose Category"
        ) {
          return true;
        }
        return item.b3_Category?.toString().includes(selected_category.b1_DESC);
      };

      return search_by_text && search_by_brand() && search_by_category();
    });

    set_osa_product_data(filtered);
    // }, [raw_osa_product_data, search_query, selected_brand, selected_category]);
  }, [raw_osa_product_data]);

  const filtered_osa_product_data = osa_product_data.filter((item) => {
    const search_by_text = item.a5_SKUName
      ?.toLowerCase()
      .includes(search_query.toLowerCase());

    const search_by_brand = () => {
      if (
        selected_brand.b1_DESC === "ALL" ||
        selected_brand.b1_DESC === "Choose Brand"
      ) {
        return true;
      }
      return item.a3_Brand?.toString().includes(selected_brand.b1_DESC);
    };

    const search_by_category = () => {
      if (
        selected_category.b1_DESC === "ALL" ||
        selected_category.b1_DESC === "Choose Category"
      ) {
        return true;
      }
      return item.b3_Category?.toString().includes(selected_category.b1_DESC);
    };

    return search_by_text && search_by_brand() && search_by_category();
  });

  const get_filtered_length = (
    data,
    search_query,
    selected_brand,
    selected_category,
  ) => {
    const filtered = data.filter((item) => {
      // Check if the Action ID is null
      const is_null = item.a3_ActionID == null;

      // Check if the SKU name matches the search query
      const search_by_text = item.a5_SKUName
        ?.toLowerCase()
        .includes(search_query.toLowerCase());

      // Check if the brand matches the selected brand
      const search_by_brand = () => {
        if (
          selected_brand.b1_DESC === "ALL" ||
          selected_brand.b1_DESC === "Choose Brand"
        ) {
          return true;
        }
        return item.a3_Brand?.toString().includes(selected_brand.b1_DESC);
      };

      // Check if the category matches the selected category
      const search_by_category = () => {
        if (
          selected_category.b1_DESC === "ALL" ||
          selected_category.b1_DESC === "Choose Category"
        ) {
          return true;
        }
        return item.b3_Category?.toString().includes(selected_category.b1_DESC);
      };

      // Ensure the item matches all filters and has Action ID as null
      return (
        is_null && search_by_text && search_by_brand() && search_by_category()
      );
    });

    return filtered.length; // Return the length of the filtered array
  };

  const filtered_tara_length = get_filtered_length(
    null_osa_list,
    search_query,
    selected_brand,
    selected_category,
  );

  const null_tara_length = null_osa_list.filter(
    (item) => item.expiry_date == null,
  ).length;

  // const filtered_tara_length = osa_product_data.filter(
  //   (item) => item.a3_ActionID == null
  // ).length;

  const countTaraLengths = (data) => {
    const result = {
      available_tara_length: 0,
      critical_tara_length: 0,
      overstock_tara_length: 0,
      out_of_stock_tara_length: 0,
      not_carried_tara_length: 0,
      total_tara_length: 0,
    };

    // Loop through data once
    data.forEach((item) => {
      if (item.a3_ActionID === 1) {
        result.available_tara_length += 1;
      }
      if (item.a3_ActionID === 2) {
        result.critical_tara_length += 1;
      }
      if (item.a3_ActionID === 3) {
        result.overstock_tara_length += 1;
      }
      if (item.a3_ActionID === 4) {
        result.out_of_stock_tara_length += 1;
      }
      if (item.a3_ActionID === 5) {
        result.not_carried_tara_length += 1;
      }
    });

    // Calculate total tara length
    result.total_tara_length =
      result.available_tara_length +
      result.critical_tara_length +
      result.overstock_tara_length +
      result.out_of_stock_tara_length +
      result.not_carried_tara_length;

    return result;
  };

  const taraLengths = countTaraLengths(null_osa_list);

  // Calculate the total tara length (summation of specific categories)
  const totalTaraLength =
    taraLengths.available_tara_length +
    taraLengths.critical_tara_length +
    taraLengths.overstock_tara_length +
    taraLengths.out_of_stock_tara_length +
    taraLengths.not_carried_tara_length;
  // - [Fetch Data] SKU

  // + [Data Filter] Branch and Category
  const [brand_data, set_brand_data] = useState([]);
  const [filter_category_data, set_filter_category_data] = useState([]);
  const [search_brand, set_search_brand] = useState("");

  useEffect(() => {
    const dbRef = ref(db, "/DB_TEST/TBL_SKU_BRAND/DATA");
    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const initial_item = {
            a1_ID: 0,
            b1_DESC: "ALL",
            c1_CAT: "",
          };

          const transformed_data = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));

          const final_data = [initial_item, ...transformed_data];
          const filtered_data = apply_brand_filter(final_data, search_brand);
          set_brand_data(filtered_data);
        } else {
          set_brand_data([]);
        }
      },
      (error) => {
        console.error("Error fetching SKU brand data:", error);
        set_brand_data([]);
      },
    );

    return () => unsubscribe();
  }, [search_brand]);

  const apply_brand_filter = (data, query) => {
    return data.filter((item) => {
      const search_by_text = item.b1_DESC
        ?.toString()
        .toLowerCase()
        .includes(query.toLowerCase());
      return search_by_text;
    });
  };

  const filter_category = (selected_brand) => {
    if (selected_brand.c1_CAT) {
      const category_data = selected_brand.c1_CAT.split(",");

      const initial_item = {
        a1_ID: 0,
        b1_DESC: "ALL",
      };

      const filtered_categories = category_data.map((name, index) => ({
        a1_ID: index + 1,
        b1_DESC: name,
      }));

      const final_data = [initial_item, ...filtered_categories];
      set_filter_category_data(final_data);
    } else {
      set_filter_category_data([]);
    }
  };
  // - [Data Filter] Branch and Category

  // + [Update Data] SKU
  const update_sku_status = async (matcode, actionId) => {
    const verify_quantity = (actionId, value) =>
      actionId === 1 || actionId === 4 || actionId === 5
        ? 0
        : parseInt(value) || 0;

    const pcs_value = verify_quantity(actionId, selected_osa.a7_Pcs);
    const cases_value = verify_quantity(actionId, selected_osa.a8_Cases);
    const innerbox_value = verify_quantity(actionId, selected_osa.a9_InnerBox);
    const remarks_value = verify_quantity(actionId, selected_osa.b2_Remarks);

    if (
      (actionId === 2 || actionId === 3) &&
      pcs_value + cases_value + innerbox_value <= 0
    ) {
      return;
    }

    const formatted_date = formate_date(new Date(), "mm/dd/yyyy");

    const updated_data = {
      a1_Matcode: matcode,
      a2_Storecode: GENERAL_STORE_CODE,
      a3_ActionID: actionId,
      a4_SubActionID: 0,
      a5_Dateupdated: formatted_date,
      a7_Pcs: pcs_value || 0,
      a8_Cases: cases_value || 0,
      a9_InnerBox: innerbox_value || 0,
      b1_ExpiryDate: "",
      b2_Remarks: remarks_value || 0,
      b3_ExpiryDates: "",
    };

    const update_data_in_local_state = (stateUpdater) => {
      stateUpdater((prev_data) =>
        prev_data.map((item) =>
          item.a1_Matcode === matcode ? { ...item, ...updated_data } : item,
        ),
      );
    };

    update_data_in_local_state(set_osa_product_data);
    update_data_in_local_state(set_null_osa_list);

    const db2Ref = ref(db, `${TBL_OSA_PATH}`);
    const db2Snapshot = await get(db2Ref);
    const db2Data = db2Snapshot.val() || {};

    let existing_matcodeKey = Object.keys(db2Data).find(
      (key) => db2Data[key].a1_Matcode === matcode,
    );

    const updated_sku_data = {
      ...(db2Data[existing_matcodeKey] || {}),
      ...updated_data,
      a6_UpdatedBy: GENERAL_USERNAME.toString(),
    };

    const db2RefToUse = existing_matcodeKey
      ? ref(db, `${TBL_OSA_PATH}/${existing_matcodeKey}`)
      : ref(db, `${TBL_OSA_PATH}/${matcode}`);

    await set(db2RefToUse, updated_sku_data);

    await update(
      ref(db, `${TBL_MCP_PATH}/${GENERAL_USERNAME}/${GENERAL_MCP_ID}`),
      {
        z_nerm_status: 0,
      },
    );

    update_osa_completion_manual("not_done");

    if (actionId === 2 || actionId === 3) {
      set_is_state_qty_modal_open(false);
    }
  };
  // - [Update Data] SKU

  // + [Save Data] OSA Tara
  const save_tara_osa = async () => {
    const BATCH_SIZE = 50;
    const date_now = new Date();

    // const has_invalid_id = null_osa_list.some(
    //   (item) => item.a3_ActionID == null,
    // );

    // if (user_account_data.l1_Access_All_Storecode === "0" && has_invalid_id) {
    //   set_is_error_modal_open(true);
    //   return;
    // }

    // const filtered_matcode = null_osa_list.filter(
    //   (item) => item.a3_ActionID === 5,
    // );

    // if (filtered_matcode.length === 0) {
    //   return handle_osa_completion();
    // }

    // for (let i = 0; i < filtered_matcode.length; i += BATCH_SIZE) {
    //   const batch = filtered_matcode.slice(i, i + BATCH_SIZE);
    //   const batch_promises = batch.map((item) => {
    //     const osa_tara_data = {
    //       a1_Matcode: item.a1_Matcode,
    //       a2_Storecode: GENERAL_STORE_CODE,
    //       a3_ActionID: 5,
    //       a4_SubActionID: 0,
    //       a5_Dateupdated: formate_date(date_now, "mm/dd/yyyy"),
    //       a6_UpdatedBy: GENERAL_USERNAME,
    //       a7_Pcs: 0,
    //       a8_Cases: 0,
    //       a9_InnerBox: 0,
    //       b1_ExpiryDate: "",
    //       b2_Remarks: 0,
    //       b3_ExpiryDates: "",
    //     };

    //     return set(
    //       ref(
    //         db,
    //         `DB_TEST/TBL_OSA/DATA/${formate_date(
    //           date_now,
    //           "mm-dd-yyyy",
    //         )}/${GENERAL_USERNAME}/${GENERAL_STORE_CODE}/${item.a1_Matcode}`,
    //       ),
    //       osa_tara_data,
    //     );
    //   });

    //   await Promise.all(batch_promises);
    // }

    handle_osa_completion();
  };

  const handle_osa_completion = () => {
    if (GENERAL_DIVERSION !== "NOT_LISTED") {
      update_osa_completion();
    } else {
      update_osa_completion_manual("done");
    }
  };
  // - [Save Data] OSA Tara

  // + [Update Data] OSA Completion
  const get_osa_completion_status = () => {
    if (GENERAL_DIVERSION !== "NOT_LISTED") {
      onValue(
        ref(db, `${TBL_MCP_PATH}/${GENERAL_USERNAME}/${GENERAL_MCP_ID}`),
        (snapshot) => {
          let data = snapshot.val();
          set_osa_completion_status(data.z_nerm_status);
        },
      );
    }
  };

  const get_osa_completion_status_manual = () => {
    const date_now = new Date();
    const path = `${TBL_MANUAL_SELECTION_PROGRESS}/${GENERAL_USERNAME}/${GENERAL_STORE_CODE}`;
    onValue(ref(db, path), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data) {
          if (
            formate_date(date_now, "mm/dd/yyyy") === data.z_nerm_date_updated
          ) {
            set_osa_completion_status_manual(data.z_nerm_status);
          } else {
            set_osa_completion_status_manual(0);
          }
        }
      } else {
        set_osa_completion_status_manual(0);
      }
    });
  };

  const update_osa_completion_manual = async (progress_remarks) => {
    const date_now = new Date();

    if (progress_remarks === "done") {
      try {
        await update(
          ref(
            db,
            `${TBL_MANUAL_SELECTION_PROGRESS}/${GENERAL_USERNAME}/${GENERAL_STORE_CODE}`,
          ),
          {
            a1_ID: GENERAL_STORE_CODE,
            z_nerm_date_updated: formate_date(date_now, "mm/dd/yyyy"),
            z_nerm_status: 1,
          },
        ).then(() => {
          set_is_save_modal_open(false);
        });
      } catch (error) {
        console.log("Error updating data: ", error);
      }
    } else {
      try {
        await update(
          ref(
            db,
            `${TBL_MANUAL_SELECTION_PROGRESS}/${GENERAL_USERNAME}/${GENERAL_STORE_CODE}`,
          ),
          {
            a1_ID: GENERAL_STORE_CODE,
            z_nerm_date_updated: formate_date(date_now, "mm/dd/yyyy"),
            z_nerm_status: 0,
          },
        );
      } catch (error) {
        console.log("Error updating data: ", error);
      }
    }
  };

  const update_osa_completion = async () => {
    const date_now = new Date();
    try {
      await update(
        ref(db, `${TBL_MCP_PATH}/${GENERAL_USERNAME}/${GENERAL_MCP_ID}`),
        {
          z_nerm_status: 1,
          b3_ActualDateVisited: formate_date(date_now, "mm/dd/yyyy"),
        },
      )
        .then(() => {
          set_is_save_modal_open(false);
        })
        .catch((error) => {
          alert("Error updating data. Please check your internet.");
          console.log("Error updating data: ", error);
        });
    } catch (error) {
      alert("Error updating data. Please check your internet.");
      console.log("Error updating data: ", error);
    }
  };

  useEffect(() => {
    get_osa_completion_status();
    get_osa_completion_status_manual();
  }, []);
  // - [Update Data] OSA Completion

  const get_osa_tara_template = (osa_product_data) => {
    const filteredData = osa_product_data.filter((item) =>
      item.hasOwnProperty("a3_ActionID"),
    );
  };

  const save_osa_tara_template = async (osa_product_data) => {
    try {
      // Filter out items with "a3_ActionID"
      const filteredData = osa_product_data.filter((item) =>
        item.hasOwnProperty("a3_ActionID"),
      );

      // Loop through each filtered data item
      for (const item of filteredData) {
        const path = `/DB_TEST/TBL_OSA_TARA_TEMPLATE/DATA/${GENERAL_USERNAME}/${GENERAL_STORE_CODE}/${item.a1_Matcode}`;

        // Save each item to Firebase
        await set(ref(db, path), item);
      }
      Alert.alert(
        "Saved Template",
        `You have successfully save an OSA template for store code: ${GENERAL_STORE_CODE}`,
        [
          {
            text: "OK",
            style: "cancel",
          },
        ],
        { cancelable: true },
      );
    } catch (error) {
      console.error("Error saving OSA Tara Template:", error);
    }
  };

  const template_option = () => {
    Alert.alert(
      "Choose a OSA template option",
      "What would you like to do?",
      [
        {
          text: "Save",
          onPress: () => {
            save_template_confirm();
          },
        },
        {
          text: "Load",
          onPress: () => {
            load_template();
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true },
    );
  };

  const save_template_confirm = () => {
    Alert.alert(
      "Confirmation",
      "Are you sure you want to save this NERM template?",
      [
        {
          text: "Yes",
          onPress: () => {
            save_osa_tara_template(osa_product_data);
          },
        },
        {
          text: "No",
          style: "cancel",
        },
      ],
      { cancelable: true },
    );
  };

  // Load template data and merge with existing data
  const load_template = async () => {
    try {
      // Fetch template data from Firebase
      const template_data_ref = ref(
        db,
        `/DB_TEST/TBL_OSA_TARA_TEMPLATE/DATA/${GENERAL_USERNAME}/${GENERAL_STORE_CODE}`,
      );
      const template_snapshot = await get(template_data_ref);
      const data = template_snapshot.val() || {};

      if (Object.keys(data).length === 0) {
        Alert.alert(
          "No Data Found",
          "No template data found for the specified store and user.",
          [
            {
              text: "OK",
              style: "cancel",
            },
          ],
          { cancelable: true },
        );
        return; // Stop the function if no data exists
      }
      set_is_template_loading(true);
      const values = Object.values(data); // Convert to an array of values

      // Get current date to set for a5_Dateupdated
      const currentDate = formate_date(date_now, "mm/dd/yyyy");

      // Step 1: Get the existing merged data (could be from state or previously fetched data)
      const existing_data = raw_osa_product_data || []; // Assuming `raw_osa_product_data` holds the previous merged state

      // Step 2: Merge template data with existing data
      const merged_data = existing_data.map((existing_item) => {
        // Find matching item in template data based on a1_Matcode
        const matched_item_template = values.find(
          (item) => item.a1_Matcode === existing_item.a1_Matcode,
        );

        if (matched_item_template) {
          // If there is a match, merge the template data with the existing item (overwrite specific properties)
          return {
            ...existing_item, // Keep the existing data
            ...matched_item_template, // Overwrite with the template data
            a5_Dateupdated: currentDate, // Override the a5_Dateupdated with the current date
          };
        }

        // If no match, keep the existing item as is
        return existing_item;
      });

      // Step 3: Add any new template data that doesn't already exist in the merged_data
      const new_data = values.filter(
        (item) =>
          !existing_data.some(
            (existing_item) => existing_item.a1_Matcode === item.a1_Matcode,
          ),
      );

      // Append new data items (if any)
      const final_data = [...merged_data, ...new_data];

      // Step 4: Update the state with the final merged data
      set_null_osa_list(final_data);
      set_raw_osa_product_data(final_data);
      save_osa_with_actionID(final_data);

      // console.log("Final Merged Data with Updated a5_Dateupdated:", final_data);
    } catch (error) {
      console.error("Error loading template data:", error);
    }
  };

  const save_osa_with_actionID = async (null_osa_list) => {
    const BATCH_SIZE = 50;
    const date_now = new Date();

    // Filter out items that have a valid a3_ActionID (not null or undefined)
    const filtered_matcode = null_osa_list.filter(
      (item) => item.a3_ActionID != null,
    );

    // Process data in batches of BATCH_SIZE
    for (let i = 0; i < filtered_matcode.length; i += BATCH_SIZE) {
      const batch = filtered_matcode.slice(i, i + BATCH_SIZE);

      // Map each item in the batch to a promise that writes to Firebase
      const batch_promises = batch.map((item) => {
        // Set the data in Firebase at the specific location for each item
        return set(
          ref(
            db,
            `DB_TEST/TBL_OSA/DATA/${formate_date(
              date_now,
              "mm-dd-yyyy",
            )}/${GENERAL_USERNAME}/${GENERAL_STORE_CODE}/${item.a1_Matcode}`,
          ),
          item,
        );
      });

      // Wait for all promises in the batch to complete
      await Promise.all(batch_promises);
      refresh_sku_list();
    }
  };

  const refresh_sku_list = async () => {
    set_search_query("");
    set_selected_brand({
      a1_ID: 0,
      b1_DESC: "Choose Brand",
    });
    set_selected_category;
    ({
      a1_ID: 0,
      b1_DESC: "Choose Category",
    });
    await fetch_data_osa_product_data();
    setTimeout(() => {
      set_is_template_loading(false);
    }, 3000);
  };

  const handle_check_connection = (count) => {
    NetInfo.fetch()
      .then((state) => {
        if (state.isConnected && state.isInternetReachable) {
          verify_raw_osa_count(count);
        } else {
          Alert.alert("No Connection", "You're not connected to the internet.");
        }
      })
      .catch((error) => {
        console.error("Network check failed:", error);
        Alert.alert("⚠️ Error", "Unable to check network status.");
      });
  };

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

  const update_inventory = () => {
    console.log(selectedSKU.a1_Matcode);
    console.log(casesInput);
    console.log(innerBoxInput);
    console.log(piecesInput);
    console.log(formate_date(expiry_date, "mm/dd/yyyy"));
    console.log(formate_date(inventory_date, "mm/dd/yyyy"));
  };

  // + [Update Data] SKU
  const update_inventory_test = async (matcode) => {
    const formatted_date = formate_date(new Date(), "mm/dd/yyyy");
    const updated_data = {
      a1_Matcode: matcode,
      a2_Storecode: GENERAL_STORE_CODE,
      a5_Dateupdated: formatted_date,
      cases: casesInput || "",
      inner_box: innerBoxInput || "",
      pieces: piecesInput || "",
      expiry_date: formate_date(expiry_date, "mm/dd/yyyy"),
      inventory_date: formate_date(inventory_date, "mm/dd/yyyy"),
    };

    const update_data_in_local_state = (stateUpdater) => {
      stateUpdater((prev_data) =>
        prev_data.map((item) =>
          item.a1_Matcode === matcode ? { ...item, ...updated_data } : item,
        ),
      );
    };

    update_data_in_local_state(set_osa_product_data);
    update_data_in_local_state(set_null_osa_list);

    const db2Ref = ref(db, `${TBL_OSA_PATH}`);
    const db2Snapshot = await get(db2Ref);
    const db2Data = db2Snapshot.val() || {};

    let existing_matcodeKey = Object.keys(db2Data).find(
      (key) => db2Data[key].a1_Matcode === matcode,
    );

    const updated_sku_data = {
      ...(db2Data[existing_matcodeKey] || {}),
      ...updated_data,
      a6_UpdatedBy: GENERAL_USERNAME.toString(),
    };

    const db2RefToUse = existing_matcodeKey
      ? ref(db, `${TBL_OSA_PATH}/${existing_matcodeKey}`)
      : ref(db, `${TBL_OSA_PATH}/${matcode}`);

    await set(db2RefToUse, updated_sku_data);
    await update(
      ref(db, `${TBL_MCP_PATH}/${GENERAL_USERNAME}/${GENERAL_MCP_ID}`),
      {
        z_nerm_status: 0,
      },
    );

    update_osa_completion_manual("not_done");
    // setModalVisible(false);
    // await update(
    //   ref(db, `${TBL_MCP_PATH}/${GENERAL_USERNAME}/${GENERAL_MCP_ID}`),
    //   {
    //     z_nerm_status: 0,
    //   },
    // );

    // update_osa_completion_manual("not_done");

    // if (actionId === 2 || actionId === 3) {
    //   set_is_state_qty_modal_open(false);
    // }
  };
  // - [Update Data] SKU

  const [is_add_entry_loading, set_is_add_entry_loading] = useState(false);
  // --- FUNCTION: PUSH DATA SA FIREBASE ---
  const handleAddEntrySubmit = async () => {
    try {
      set_is_add_entry_loading(true);
      const unixTimestamp = Date.now().toString(); // Kuhanin ang kasalukuyang Unix Timestamp bilang ID/Key
      const custom_id = `${GENERAL_USERNAME}_${GENERAL_STORE_CODE}_${selectedSKU.a1_Matcode}_${unixTimestamp}`;

      // I-format ang data base sa iyong standard structure
      const newEntryData = {
        id: custom_id,
        unix: unixTimestamp,
        a1_Matcode: selectedSKU.a1_Matcode,
        a2_Storecode: GENERAL_STORE_CODE,
        a5_Dateupdated: formate_date(new Date(), "mm/dd/yyyy"),
        cases: casesInput || "0",
        inner_box: innerBoxInput || "0",
        pieces: piecesInput || "0",
        expiry_date: formate_date(expiry_date, "mm/dd/yyyy"),
        inventory_date: formate_date(inventory_date, "mm/dd/yyyy"),
      };

      // Ihanda ang sabay na pagsusulat (Atomic Update) sa dalawang magkaibang path
      const updates = {};
      updates[
        `/DB_TEST/TBL_NERM/HISTORY/${GENERAL_USERNAME}/${GENERAL_STORE_CODE}/${selectedSKU.a1_Matcode}/${custom_id}`
      ] = newEntryData;
      updates[`/DB_TEST/TBL_NERM/LOGS/${custom_id}`] = newEntryData;

      // Isave nang sabay sa Firebase Realtime Database
      await update(ref(db), updates);

      // I-update ang kabuuang inventory
      await update_inventory_test(selectedSKU.a1_Matcode);

      // I-reset ang mga text inputs pagkatapos mag-save
      setCasesInput("");
      setInnerBoxInput("");
      setPiecesInput("");

      // Ibalik sa List View ang user
      setIsAddingEntry(false);
    } catch (error) {
      console.error("Firebase Save Error: ", error);
      alert("Failed to save entry. Please try again.");
    } finally {
      set_is_add_entry_loading(false);
    }
  };

  const handleDeleteEntry = (item) => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this stock entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Ihanda ang atomic delete sa pamamagitan ng pag-set ng null sa mga paths
              const deletes = {};
              deletes[
                `/DB_TEST/TBL_NERM/HISTORY/${GENERAL_USERNAME}/${GENERAL_STORE_CODE}/${selectedSKU.a1_Matcode}/${item.id}`
              ] = null;
              deletes[`/DB_TEST/TBL_NERM/LOGS/${item.id}`] = null;

              // Sabay na buburahin ang data sa parehong lokasyon
              await update(ref(db), deletes);

              // I-update ang kabuuang inventory base sa natitirang entries (I-uncomment mo kung gagamitin mo na ito)
              await update_inventory_test(selectedSKU.a1_Matcode);

              alert("Entry deleted successfully.");
            } catch (error) {
              console.error("Firebase Delete Error: ", error);
              alert("Failed to delete entry. Please try again.");
            }
          },
        },
      ],
    );
  };

  // RETURN ORIGIN
  return (
    <React.Fragment>
      <View style={tw`h-full w-full justify-start items-center bg-[#fff]`}>
        {/* + [Navigation] Sidebar */}
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
          {/* + NAVIGATION BUTTONS */}
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
          {/* - NAVIGATION BUTTONS */}
        </Animated.View>
        {/* - [Navigation] Sidebar */}
        <View
          style={[
            tw`bg-[#028543] w-full pt-4 pb-4 px-2 absolute top-0 rounded-b-[30px] shadow-lg`,
          ]}
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
                numberOfLines={1}
              >
                NERM INVENTORY
              </Text>
            </View>

            {/* Right Icon: Home */}
            <TouchableOpacity
              style={tw`w-12 h-12 justify-center items-center bg-white/10 rounded-xl`}
              onPress={() => set_tds_ui_navigation("main_page")}
            >
              <FontAwesome name="home" size={26} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={tw`w-full flex justify-center items-center mt-[100] px-[20] border-b-[0.7] border-b-[#DBDBDB]`}
        >
          <TouchableOpacity
            style={tw`w-full flex justify-center items-center py-[10]`}
            onPress={() => get_osa_tara_template(osa_product_data)}
          >
            <Text style={tw`text-[4.7] text-[#028543] font-bold text-center`}>
              {GENERAL_STORE_CODE} - {GENERAL_SELECTED_STORE}
            </Text>
            <Text
              style={tw`text-[3.2] tracking-[0.2] text-[#028543] font-bold text-center`}
            >
              {GENERAL_CHANNEL} | {GENERAL_TAGGING} | {GENERAL_POSITION}
            </Text>
          </TouchableOpacity>
          {/* + [Selection] Brand */}
          <View style={tw`w-full h-[13] justify-center items-center`}>
            <TouchableOpacity
              style={tw`flex flex-row justify-center h-[10] bg-[#fff] rounded-lg border-[0.5] border-[#028543]`}
              onPress={() => set_is_select_brand_modal_open(true)}
            >
              <View style={tw`flex-5 justify-center pl-[20]`}>
                <Text style={tw`text-[4] tracking-[0.1] text-[#028543]`}>
                  {selected_brand.b1_DESC}
                </Text>
              </View>
              <View style={tw`flex flex-1 justify-center items-center`}>
                <Text>
                  <FontAwesome
                    name="chevron-down"
                    size={15}
                    color={"#028543"}
                  />
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {/* - [Selection] Brand */}
          {/* + [Selection] Category */}
          <View style={tw`w-full h-[13] justify-center items-center`}>
            <TouchableOpacity
              style={tw`flex flex-row justify-center h-[10] bg-[#fff] rounded-lg border-[0.5] border-[#028543]`}
              onPress={() => {
                set_is_select_category_modal_open(true);
              }}
            >
              <View style={tw`flex-5 justify-center pl-[20]`}>
                <Text style={tw`text-[4] tracking-[0.1] text-[#028543]`}>
                  {selected_category.b1_DESC}
                </Text>
              </View>
              <View style={tw`flex flex-1 justify-center items-center`}>
                <Text>
                  <FontAwesome
                    name="chevron-down"
                    size={15}
                    color={"#028543"}
                  />
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {/* - [Selection] Category */}
          {/* + [Input] Search SKU */}
          <View
            style={tw`w-full h-[13] flex flex-row justify-center items-center mb-[10]`}
          >
            <View
              style={tw`h-[10] pl-[15] flex flex-1 flex-row justify-center bg-[#fff] rounded-lg border-[0.5] border-[#028543]`}
            >
              <TextInput
                placeholder="Search..."
                placeholderTextColor={`gray`}
                style={tw`flex-1 text-[4.4] p-[0]`}
                onChangeText={(text) => set_search_query(text)}
                value={search_query}
              ></TextInput>
              <View style={tw`justify-center items-center w-[12] pb-[2]`}>
                <FontAwesome name="search" size={20} color={"#028543"} />
              </View>
            </View>
          </View>
          {/* - [Input] Search SKU */}
        </View>
        <View style={tw`w-full flex-1`}>
          <View style={tw`w-full flex-6`}>
            <View style={tw`flex w-full h-full bg-[#F0F2F5]`}>
              <View style={tw`flex-1 justify-start items-center`}>
                <View style={tw`w-full h-full px-[7]`}>
                  {/* + [Flat List] SKU List */}
                  <FlatList
                    data={filtered_osa_product_data}
                    renderItem={({ item }) => {
                      function verify_status(sku_mat_code, sku_status) {
                        if (sku_mat_code === item.a1_Matcode) {
                          if (sku_status === item.a3_ActionID) {
                            return "#028543";
                          } else {
                            return "#FFF";
                          }
                        }
                      }

                      return (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedSKU(item);
                            // setCasesInput(item.cases || "");
                            // setInnerBoxInput(item.inner_box || "");
                            // setPiecesInput(item.pieces || "");

                            // --- Handling Expiry Date ---
                            if (item.expiry_date) {
                              const parts = item.expiry_date.split("/");
                              // I-set ang mismong Date Object
                              set_expiry_date(
                                new Date(parts[2], parts[0] - 1, parts[1]),
                              );
                            } else {
                              set_expiry_date(new Date()); // Default current date object
                            }

                            // --- Handling Inventory Date ---
                            if (item.inventory_date) {
                              const parts = item.inventory_date.split("/");
                              // I-set ang mismong Date Object
                              set_inventory_date(
                                new Date(parts[2], parts[0] - 1, parts[1]),
                              );
                            } else {
                              set_inventory_date(new Date()); // Default current date object
                            }

                            setModalVisible(true);
                          }}
                          activeOpacity={1}
                        >
                          <View style={tw`flex justify-center px-[15] my-[10]`}>
                            <View
                              style={tw`flex h-[47] rounded-lg bg-[#FFF] shadow`}
                              key={item.a1_Matcode}
                            >
                              <View
                                style={tw`flex-1 w-full justify-center items-center px-[7] pt-[4]`}
                              >
                                <View
                                  style={tw`flex-0.8 w-full justify-center items-center ${
                                    item.expiry_date == null
                                      ? "bg-[#DE4343]"
                                      : "bg-[#028543]"
                                  } rounded-md`}
                                >
                                  <Text
                                    style={tw`text-[#FFF] text-[4] tracking-[0.1]`}
                                  >
                                    {item.a5_SKUName}
                                  </Text>
                                </View>
                              </View>
                              <View
                                style={tw`flex-4 px-[10] pb-[7] justify-around`}
                              >
                                {/* Row 1: Cases, Inner Box, Pieces */}
                                <View
                                  style={tw`flex-row justify-between border-b border-gray-100 pb-1 px-5`}
                                >
                                  <View style={tw`items-center`}>
                                    <Text
                                      style={tw`text-[3] text-gray-500 uppercase`}
                                    >
                                      Cases
                                    </Text>
                                    <Text
                                      style={tw`text-[4] font-bold text-gray-800`}
                                    >
                                      {item.cases || 0}
                                    </Text>
                                  </View>
                                  <View style={tw`items-center`}>
                                    <Text
                                      style={tw`text-[3] text-gray-500 uppercase`}
                                    >
                                      Inner Box
                                    </Text>
                                    <Text
                                      style={tw`text-[4] font-bold text-gray-800`}
                                    >
                                      {item.inner_box || 0}
                                    </Text>
                                  </View>
                                  <View style={tw`items-center`}>
                                    <Text
                                      style={tw`text-[3] text-gray-500 uppercase`}
                                    >
                                      Pieces
                                    </Text>
                                    <Text
                                      style={tw`text-[4] font-bold text-gray-800`}
                                    >
                                      {item.pieces || 0}
                                    </Text>
                                  </View>
                                </View>

                                {/* Row 2: Expiry and Inventory Dates */}
                                <View
                                  style={tw`flex-row justify-between pt-1 px-5`}
                                >
                                  <View>
                                    <Text style={tw`text-[3] text-gray-500`}>
                                      Expiry Date:
                                    </Text>
                                    <Text
                                      style={tw`text-[3.5] font-semibold text-gray-800`}
                                    >
                                      {item.expiry_date || "N/A"}
                                    </Text>
                                  </View>
                                  <View style={tw`items-end`}>
                                    <Text style={tw`text-[3] text-gray-500`}>
                                      Inventory Date:
                                    </Text>
                                    <Text
                                      style={tw`text-[3.5] font-semibold text-gray-800`}
                                    >
                                      {item.inventory_date || "N/A"}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />
                  {/* - [Flat List] SKU List */}
                </View>
              </View>
            </View>
          </View>
          <View
            style={tw`w-full py-[10] justify-center items-center border-t-[0.7] border-t-[#DBDBDB]`}
          >
            <View
              style={tw`flex flex-row justify-center items-center h-[12] px-[25]`}
            >
              <View
                style={tw`flex-1 flex-row w-full h-full justify-center items-center`}
              >
                {/* + [Indication] Total Items Left */}
                <TouchableOpacity
                  style={tw`flex-1 w-full h-full justify-center items-start`}
                  // onPress={() => set_is_tara_overview_modal_open(true)}
                >
                  <View
                    style={tw`flex-0.7 w-full h-full justify-center items-start`}
                  >
                    {/* <Text
                      style={tw`text-[3.4] text-[#028543] font-bold tracking-[0.2]`}
                    >
                      Filtered Items Left: {filtered_tara_length}
                    </Text> */}
                    <Text
                      style={tw`text-[3.4] text-[#028543] font-bold tracking-[0.2]`}
                    >
                      Total Items Left: {null_tara_length}
                    </Text>
                  </View>
                </TouchableOpacity>
                {/* - [Indication] Total Items Left */}
                {/* + [Button] Save OSA Tara */}
                {GENERAL_DIVERSION !== "NOT_LISTED" ? (
                  <React.Fragment>
                    {osa_completion_status === 0 ? (
                      <TouchableOpacity
                        style={tw`flex-1 w-full h-full justify-center items-center bg-[#FFF] border-[0.4] border-[#028543] rounded-lg`}
                        onPress={() => {
                          handle_check_connection(raw_osa_product_data.length);
                        }}
                      >
                        <Text
                          style={tw`text-[4.2] text-[#028543] font-bold tracking-[0.4] text-center`}
                        >
                          SAVE
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    {osa_completion_status === 1 ? (
                      <View
                        style={tw`flex-1 w-full h-full justify-center items-center bg-[#028543] border-[0.4] border-[#028543] rounded-lg`}
                      >
                        <FontAwesome name="check" size={32} color={"#fff"} />
                      </View>
                    ) : null}
                  </React.Fragment>
                ) : null}

                {GENERAL_DIVERSION === "NOT_LISTED" ? (
                  <React.Fragment>
                    {osa_completion_status_manual === 0 ? (
                      <TouchableOpacity
                        style={tw`flex-0.7 w-full h-full justify-center items-center bg-[#FFF] border-[0.4] border-[#028543] rounded-lg`}
                        onPress={() => {
                          handle_check_connection(raw_osa_product_data.length);
                        }}
                      >
                        <Text
                          style={tw`text-[4.2] text-[#028543] font-bold tracking-[0.4] text-center`}
                        >
                          SAVE
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    {osa_completion_status_manual === 1 ? (
                      <View
                        style={tw`flex-1 w-full h-full justify-center items-center bg-[#028543] border-[0.4] border-[#028543] rounded-lg`}
                      >
                        <FontAwesome name="check" size={32} color={"#fff"} />
                      </View>
                    ) : null}
                  </React.Fragment>
                ) : null}
                {/* - [Button] Save OSA Tara */}
              </View>
            </View>
          </View>
        </View>
        {/* + [Modal] Branch Selection */}
        <Modal isOpen={is_select_brand_modal_open}>
          <View style={tw`bg-white w-full rounded-xl`}>
            <View
              style={tw`flex flex-row justify-center items-center mt-[15] pl-5`}
            >
              <View style={tw`flex-5`}>
                <Text
                  style={tw`text-[5.4] tracking-[0.1] font-bold text-[#028543]`}
                >
                  Brand Selection
                </Text>
              </View>
              <View style={tw`flex flex-1 justify-center items-center pr-1`}>
                <Pressable
                  onPress={() => {
                    set_is_select_brand_modal_open(false);
                  }}
                >
                  <Ionicons name="close" size={32} color={"#028543"} />
                </Pressable>
              </View>
            </View>
            <View style={tw`flex w-full flex flex-row px-4 mt-[20]`}>
              <View
                style={tw`h-[12] pl-[15] flex flex-row justify-center bg-[#fff] rounded-lg border-[0.5] border-[#028543] w-full`}
              >
                <TextInput
                  placeholder="Search..."
                  placeholderTextColor={`gray`}
                  style={tw`flex-1 text-[4.4]`}
                  onChangeText={(text) => set_search_brand(text)}
                ></TextInput>
                <View style={tw`justify-center items-center w-[12] pb-[1]`}>
                  <FontAwesome name="search" size={24} color={"#028543"} />
                </View>
              </View>
            </View>
            <View style={tw`pl-3 pr-2 py-3 h-[90]`}>
              <FlatList
                data={brand_data}
                style={tw`px-3`}
                renderItem={({ item }) => {
                  return (
                    <TouchableOpacity
                      style={tw`flex justify-center bg-[#fff] h-[12] rounded-md my-1`}
                      onPress={() => {
                        set_selected_category({
                          a1_ID: 0,
                          b1_DESC: "Choose Category",
                        });
                        set_selected_brand(item);
                        filter_category(item);
                        setTimeout(() => {
                          set_is_select_brand_modal_open(false);
                        }, 100);
                      }}
                    >
                      <Text style={tw`text-[5] text-[#404040]`}>
                        {item.b1_DESC}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
            <View style={tw`w-full p-3`}>
              <TouchableOpacity
                style={tw`w-full bg-[#6C757D] p-3 rounded-lg`}
                onPress={() => {
                  set_is_select_brand_modal_open(false);
                }}
              >
                <Text
                  style={tw`text-lg font-bold tracking-wider text-white text-center`}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* - [Modal] Branch Selection */}
        {/* + [Modal] Category Selection */}
        <Modal isOpen={is_select_category_modal_open}>
          <View style={tw`bg-white w-full rounded-xl`}>
            <View
              style={tw`flex flex-row justify-center items-center mt-[15] pl-5`}
            >
              <View style={tw`flex-5`}>
                <Text
                  style={tw`text-[5.4] tracking-[0.1] font-bold text-[#028543]`}
                >
                  Category Selection
                </Text>
              </View>
              <View style={tw`flex flex-1 justify-center items-center pr-1`}>
                <Pressable
                  onPress={() => {
                    set_is_select_category_modal_open(false);
                  }}
                >
                  <Ionicons name="close" size={32} color={"#028543"} />
                </Pressable>
              </View>
            </View>
            <View style={tw`pl-3 pr-2 py-3 h-[90]`}>
              <FlatList
                data={filter_category_data}
                style={tw`px-3`}
                renderItem={({ item }) => {
                  return (
                    <TouchableOpacity
                      style={tw`flex justify-center bg-[#fff] h-[12] rounded-md my-1`}
                      onPress={() => {
                        set_selected_category(item);
                        setTimeout(() => {
                          set_is_select_category_modal_open(false);
                        }, 100);
                      }}
                    >
                      <Text style={tw`text-[5] text-[#404040]`}>
                        {item.b1_DESC}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
            <View style={tw`w-full p-3`}>
              <TouchableOpacity
                style={tw`w-full bg-[#6C757D] p-3 rounded-lg`}
                onPress={() => {
                  set_is_select_category_modal_open(false);
                }}
              >
                <Text
                  style={tw`text-lg font-bold tracking-wider text-white text-center`}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* - [Modal] Category Selection */}
        {/* + [Modal] State Quantity */}
        <Modal isOpen={is_state_qty_modal_open}>
          <View style={tw`bg-white w-full rounded-xl`}>
            <View style={tw`flex flex-row justify-center items-center mt-[20]`}>
              <Text
                style={tw`text-[4.2] tracking-[0.1] font-bold text-[#028543]`}
              >
                {selected_osa.product_name || ""}
              </Text>
            </View>
            <View style={tw`h-[30] w-full flex px-4 mt-[20]`}>
              <View style={tw`flex-1 justify-center items-start w-full`}>
                <Text style={tw`text-[4.4] text-[#028543]`}>
                  Enter Quantity
                </Text>
              </View>
              <View
                style={tw`flex-2.7 flex-row justify-center items-start w-full`}
              >
                <View style={tw`flex-1 h-full p-[5]`}>
                  <View
                    style={tw`h-full w-full justify-center items-center rounded-lg border-[0.5] border-[#028543]`}
                  >
                    <TextInput
                      value={selected_osa.a7_Pcs}
                      keyboardType="numeric"
                      placeholderTextColor="gray"
                      onChangeText={(text) => {
                        const sanitized_text = text.replace(/[^0-9]/g, "");
                        set_selected_osa({
                          ...selected_osa,
                          a7_Pcs: sanitized_text,
                        });
                      }}
                      style={tw`text-center text-4.4 w-full h-full`}
                    />
                  </View>
                </View>
                <View style={tw`flex-1 h-full p-[5]`}>
                  <View
                    style={tw`h-full w-full justify-center items-center rounded-lg border-[0.5] border-[#028543]`}
                  >
                    <TextInput
                      value={selected_osa.a9_InnerBox}
                      keyboardType="numeric"
                      placeholderTextColor="gray"
                      onChangeText={(text) => {
                        const sanitized_text = text.replace(/[^0-9]/g, "");
                        set_selected_osa({
                          ...selected_osa,
                          a9_InnerBox: sanitized_text,
                        });
                      }}
                      style={tw`text-center text-4.4 w-full h-full`}
                    />
                  </View>
                </View>
                <View style={tw`flex-1 h-full p-[5]`}>
                  <View
                    style={tw`h-full w-full justify-center items-center rounded-lg border-[0.5] border-[#028543]`}
                  >
                    <TextInput
                      value={selected_osa.a8_Cases}
                      keyboardType="numeric"
                      placeholderTextColor="gray"
                      onChangeText={(text) => {
                        const sanitized_text = text.replace(/[^0-9]/g, "");
                        set_selected_osa({
                          ...selected_osa,
                          a8_Cases: sanitized_text,
                        });
                      }}
                      style={tw`text-center text-4.4 w-full h-full`}
                    />
                  </View>
                </View>
              </View>
              <View
                style={tw`flex-1 flex-row justify-center items-start w-full`}
              >
                <View style={tw`flex-1 justify-center items-center h-full`}>
                  <Text style={tw`text-[#028543] text-[4.2]`}>Cases</Text>
                </View>
                <View style={tw`flex-1 justify-center items-center h-full`}>
                  <Text style={tw`text-[#028543] text-[4.2]`}>Inner Box</Text>
                </View>
                <View style={tw`flex-1 justify-center items-center h-full`}>
                  <Text style={tw`text-[#028543] text-[4.2]`}>Pieces</Text>
                </View>
              </View>
            </View>
            <View style={tw`h-[20] w-full flex px-4 mt-[20]`}>
              <View style={tw`flex-1 justify-center items-start w-full`}>
                <Text style={tw`text-[4.4] text-[#028543]`}>Remarks</Text>
              </View>
              <View style={tw`flex-2 justify-center items-start w-full`}>
                <TouchableOpacity
                  style={tw`flex flex-row justify-center h-[12] bg-[#fff] rounded-lg border-[0.5] border-[#028543]`}
                  onPress={() => set_is_osa_remarks_modal_open(true)}
                >
                  <View style={tw`flex-5 justify-center pl-[20]`}>
                    <Text style={tw`text-[4] tracking-[0.1] text-[#028543]`}>
                      {get_osa_remarks_by_id(selected_osa.b2_Remarks) ||
                        "Choose a remark"}
                    </Text>
                  </View>
                  <View style={tw`flex flex-1 justify-center items-center`}>
                    <Text>
                      <FontAwesome
                        name="chevron-down"
                        size={15}
                        color={"#028543"}
                      />
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            <View
              style={tw`w-full flex-row justify-center items-center h-[12] px-[16] gap-3 mb-[15] mt-[20]`}
            >
              <TouchableOpacity
                style={tw`flex-1 w-full h-full justify-center items-center bg-[#028543] rounded-lg`}
                onPress={() => {
                  update_sku_status(
                    selected_osa.a1_Matcode,
                    selected_osa.a3_ActionID,
                  );
                }}
              >
                <Text
                  style={tw`text-[4.2] font-bold tracking-[0.4] text-white text-center`}
                >
                  SAVE
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 w-full h-full justify-center items-center bg-[#6C757D] rounded-lg`}
                onPress={() => {
                  set_is_state_qty_modal_open(false);
                }}
              >
                <Text
                  style={tw`text-[4.2] font-bold tracking-[0.4] text-white text-center`}
                >
                  CLOSE
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* - [Modal] State Quantity */}
        {/* + [Modal] OSA Remarks */}
        <Modal isOpen={is_osa_remarks_modal_open}>
          <View style={tw`bg-white w-full rounded-xl`}>
            <View
              style={tw`flex flex-row justify-center items-center mt-[15] pl-5`}
            >
              <View style={tw`flex-5`}>
                <Text
                  style={tw`text-[5.4] tracking-[0.1] font-bold text-[#028543]`}
                >
                  Remarks Selection
                </Text>
              </View>
              <View style={tw`flex flex-1 justify-center items-center pr-1`}>
                <Pressable
                  onPress={() => {
                    set_is_osa_remarks_modal_open(false);
                  }}
                >
                  <Ionicons name="close" size={32} color={"#028543"} />
                </Pressable>
              </View>
            </View>
            <View style={tw`pl-3 pr-2 py-3 h-[90]`}>
              <FlatList
                data={
                  selected_osa.a3_ActionID === 2
                    ? osa_critical_remarks
                    : osa_overstock_remarks
                }
                style={tw`px-3`}
                renderItem={({ item }) => {
                  return (
                    <TouchableOpacity
                      style={tw`flex justify-center bg-[#fff] h-[12] rounded-md my-1`}
                      onPress={() => {
                        set_selected_osa({
                          ...selected_osa,
                          b2_Remarks: item.a1_ID,
                        });
                        setTimeout(() => {
                          set_is_osa_remarks_modal_open(false);
                        }, 100);
                      }}
                    >
                      <Text style={tw`text-[5] text-[#404040]`}>
                        {item.b1_DESC}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
            <View style={tw`w-full p-3`}>
              <TouchableOpacity
                style={tw`w-full bg-[#6C757D] p-3 rounded-lg`}
                onPress={() => {
                  set_is_osa_remarks_modal_open(false);
                }}
              >
                <Text
                  style={tw`text-lg font-bold tracking-wider text-white text-center`}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* - [Modal] OSA Remarks */}
        {/* + [Modal] Tara Overview */}
        <Modal isOpen={is_tara_overview_modal_open}>
          <View
            style={tw`bg-white flex justify-center items-center w-full rounded-xl px-[3]`}
          >
            <View style={tw`w-full flex gap-[1] p-[24]`}>
              <View
                style={tw`w-full flex flex-row justify-center items-center`}
              >
                <Text
                  style={tw`text-[3.6] w-[40] tracking-[0.2] text-[#404040]`}
                >
                  Available Items
                </Text>
                <Text
                  style={tw`text-[3.6] w-[10] tracking-[0.2] text-[#404040]`}
                >
                  :
                </Text>
                <Text
                  style={tw`text-[3.6] flex-1 tracking-[0.2] text-[#404040]`}
                >
                  {taraLengths.available_tara_length}
                </Text>
              </View>
              <View
                style={tw`w-full flex flex-row justify-center items-center`}
              >
                <Text
                  style={tw`text-[3.6] w-[40] tracking-[0.2] text-[#404040]`}
                >
                  Critical Items
                </Text>
                <Text
                  style={tw`text-[3.6] w-[10] tracking-[0.2] text-[#404040]`}
                >
                  :
                </Text>
                <Text
                  style={tw`text-[3.6] flex-1 tracking-[0.2] text-[#404040]`}
                >
                  {taraLengths.critical_tara_length}
                </Text>
              </View>
              <View
                style={tw`w-full flex flex-row justify-center items-center`}
              >
                <Text
                  style={tw`text-[3.6] w-[40] tracking-[0.2] text-[#404040]`}
                >
                  Overstock Items
                </Text>
                <Text
                  style={tw`text-[3.6] w-[10] tracking-[0.2] text-[#404040]`}
                >
                  :
                </Text>
                <Text
                  style={tw`text-[3.6] flex-1 tracking-[0.2] text-[#404040]`}
                >
                  {taraLengths.overstock_tara_length}
                </Text>
              </View>
              <View
                style={tw`w-full flex flex-row justify-center items-center`}
              >
                <Text
                  style={tw`text-[3.6] w-[40] tracking-[0.2] text-[#404040]`}
                >
                  Out of Stock Items
                </Text>
                <Text
                  style={tw`text-[3.6] w-[10] tracking-[0.2] text-[#404040]`}
                >
                  :
                </Text>
                <Text
                  style={tw`text-[3.6] flex-1 tracking-[0.2] text-[#404040]`}
                >
                  {taraLengths.out_of_stock_tara_length}
                </Text>
              </View>
              <View
                style={tw`w-full flex flex-row justify-center items-center`}
              >
                <Text
                  style={tw`text-[3.6] w-[40] tracking-[0.2] text-[#404040]`}
                >
                  Not Carried Items
                </Text>
                <Text
                  style={tw`text-[3.6] w-[10] tracking-[0.2] text-[#404040]`}
                >
                  :
                </Text>
                <Text
                  style={tw`text-[3.6] flex-1 tracking-[0.2] text-[#404040]`}
                >
                  {taraLengths.not_carried_tara_length}
                </Text>
              </View>
              <View
                style={tw`w-full flex flex-row justify-center items-center mt-[15]`}
              >
                <Text
                  style={tw`text-[3.6] font-bold w-[40] tracking-[0.2] text-[#404040]`}
                >
                  TOTAL TARA
                </Text>
                <Text
                  style={tw`text-[3.6] font-bold w-[10] tracking-[0.2] text-[#404040]`}
                >
                  :
                </Text>
                <Text
                  style={tw`text-[3.6] font-bold flex-1 tracking-[0.2] text-[#404040]`}
                >
                  {totalTaraLength}
                </Text>
              </View>
            </View>
            <View style={tw`w-full flex-row justify-between gap-3 p-3`}>
              <TouchableOpacity
                style={tw`flex-1 bg-[#6C757D] p-3 rounded-lg`}
                onPress={() => {
                  set_is_tara_overview_modal_open(false);
                }}
              >
                <Text
                  style={tw`text-lg font-bold tracking-wider text-white text-center`}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* - [Modal] Tara Overview */}
        {/* + [Modal] Save Confirmation */}
        <Modal isOpen={is_save_modal_open}>
          <View
            style={tw`bg-white flex justify-center items-center w-full rounded-xl px-[3]`}
          >
            <View style={tw`w-full justify-center items-center py-[5] mt-[10]`}>
              <View
                style={tw`h-[25] w-[25] rounded-[100] bg-[#028543] justify-center items-center`}
              >
                <FontAwesome5 name="save" size={52} color={"#FFF"} />
              </View>
            </View>

            <View style={tw`w-full justify-center items-center py-[5] my-[10]`}>
              <Text
                style={tw`text-[4.4] text-center tracking-[0.2] text-[#404040]`}
              >
                Are you sure you want to save this NERM?
              </Text>
            </View>

            <View style={tw`w-full flex-row justify-between gap-3 p-3`}>
              <TouchableOpacity
                style={tw`flex-1 bg-[#028543] p-3 rounded-lg`}
                onPress={() => {
                  save_tara_osa();
                }}
              >
                <Text
                  style={tw`text-lg font-bold tracking-wider text-white text-center`}
                >
                  Save
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 bg-[#6C757D] p-3 rounded-lg`}
                onPress={() => {
                  set_is_save_modal_open(false);
                }}
              >
                <Text
                  style={tw`text-lg font-bold tracking-wider text-white text-center`}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* - [Modal] Save Confirmation */}
        {/* + [Modal] Save Error */}
        <Modal isOpen={is_error_modal_open}>
          <View
            style={tw`bg-white flex justify-center items-center w-full rounded-xl px-[3]`}
          >
            <View style={tw`w-full justify-center items-center py-[5] mt-[10]`}>
              <View
                style={tw`h-[25] w-[25] rounded-[100] bg-[#E44848] justify-center items-center`}
              >
                <MaterialIcons
                  name="report-gmailerrorred"
                  size={52}
                  color={"#FFF"}
                />
              </View>
            </View>

            <View style={tw`w-full justify-center items-center py-[5] my-[10]`}>
              <Text
                style={tw`text-[4.4] text-center tracking-[0.2] text-[#404040]`}
              >
                Please fill up all the items
              </Text>
            </View>

            <View style={tw`w-full flex-row justify-between gap-3 p-3`}>
              <TouchableOpacity
                style={tw`flex-1 bg-[#6C757D] p-3 rounded-lg`}
                onPress={() => {
                  set_is_error_modal_open(false);
                  set_is_save_modal_open(false);
                }}
              >
                <Text
                  style={tw`text-lg font-bold tracking-wider text-white text-center`}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* - [Modal] Save Error */}
        {/* + [Modal] Template Loading */}
        <Modal isOpen={is_template_loading}>
          <View
            style={tw`bg-white flex justify-center items-center w-full rounded-xl px-[3]`}
          >
            <View style={tw`w-full justify-center items-center py-[5] mt-[10]`}>
              <View
                style={tw`h-[18] w-[18] rounded-[100] bg-[#fff] justify-center items-center`}
              >
                <ActivityIndicator size={42} color="#028543" />
              </View>
            </View>
            <View style={tw`w-full justify-center items-center py-[5] my-[10]`}>
              <Text
                style={tw`text-[4] text-center tracking-[0.2] text-[#404040]`}
              >
                OSA is loading. Please wait.
              </Text>
            </View>
          </View>
        </Modal>
        {/* - [Modal] Template Loading */}
        {/* SKU Input Modal */}
        <ModalReact
          visible={modalVisible}
          animationType="fade"
          transparent={true}
        >
          <View style={tw`flex-1 justify-end bg-[rgba(0,0,0,0.5)]`}>
            <View style={tw`bg-white rounded-t-3xl p-6 h-[80%]`}>
              {/* Header */}
              <View style={tw`flex-row justify-between items-center mb-6`}>
                <View style={tw`flex-row items-center flex-1`}>
                  {isAddingEntry && (
                    <TouchableOpacity
                      onPress={() => setIsAddingEntry(false)}
                      style={tw`mr-3`}
                    >
                      <MaterialIcons
                        name="arrow-back"
                        size={26}
                        color="#028543"
                      />
                    </TouchableOpacity>
                  )}
                  <View>
                    <Text style={tw`text-[5] font-bold text-[#028543]`}>
                      {isAddingEntry ? "Add New Entry" : "Inventory Details"}
                    </Text>
                    <Text
                      style={tw`text-[3.2] text-gray-500`}
                      numberOfLines={1}
                    >
                      {selectedSKU?.a5_SKUName}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setIsAddingEntry(false);
                  }}
                >
                  <MaterialIcons name="close" size={28} color="gray" />
                </TouchableOpacity>
              </View>

              {/* ================= VIEW 1: LIST OF ENTRIES ================= */}
              {!isAddingEntry ? (
                <View style={tw`flex-1`}>
                  <Text
                    style={tw`text-[3.2] text-gray-400 font-bold uppercase mb-3`}
                  >
                    Current Stock Entries ({inventoryEntries.length})
                  </Text>

                  {isLoading ? (
                    <View style={tw`flex-1 justify-center items-center`}>
                      <ActivityIndicator size="large" color="#028543" />
                      <Text style={tw`text-gray-400 mt-2`}>
                        Loading entries...
                      </Text>
                    </View>
                  ) : (
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      style={tw`flex-1 mb-4`}
                    >
                      {inventoryEntries.length === 0 ? (
                        <Text
                          style={tw`text-center text-gray-400 mt-10 text-[3.8]`}
                        >
                          No entries found for this SKU.
                        </Text>
                      ) : (
                        inventoryEntries.map((item, index) => (
                          <View
                            key={item.id}
                            style={tw`border border-gray-200 rounded-2xl p-4 mb-3 bg-gray-50`}
                          >
                            <View
                              style={tw`flex-row justify-between items-center border-b border-gray-200 pb-2 mb-3`}
                            >
                              <Text
                                style={tw`font-bold text-[#028543] text-[3.5]`}
                              >
                                Entry # {inventoryEntries.length - index}
                              </Text>
                              {/* Deletion Button na pumalit sa Entry Date */}
                              <TouchableOpacity
                                onPress={() => handleDeleteEntry(item)}
                                style={tw`flex-row items-center bg-red-100 p-1 rounded-lg`}
                              >
                                {/* Pwede mong lagyan ng Trash Icon dito kung gusto mo: */}
                                <MaterialIcons
                                  name="close"
                                  size={18}
                                  color={"#EF4444"}
                                />
                                {/* <Trash2
                                  size={12}
                                  color="#EF4444"
                                  style={tw`mr-1`}
                                /> */}
                                {/* <Text
                                  style={tw`text-[2.8] text-red-500 font-bold`}
                                >
                                  Delete
                                </Text> */}
                              </TouchableOpacity>
                            </View>

                            {/* Breakdown ng Qty */}
                            <View
                              style={tw`flex-row justify-between text-center mb-3`}
                            >
                              <View style={tw`items-center flex-1`}>
                                <Text style={tw`text-[3] text-gray-400`}>
                                  Cases
                                </Text>
                                <Text
                                  style={tw`text-[4] font-bold text-gray-800`}
                                >
                                  {item.cases}
                                </Text>
                              </View>
                              <View
                                style={tw`items-center flex-1 border-x border-gray-200`}
                              >
                                <Text style={tw`text-[3] text-gray-400`}>
                                  Inner Box
                                </Text>
                                <Text
                                  style={tw`text-[4] font-bold text-gray-800`}
                                >
                                  {item.inner_box}
                                </Text>
                              </View>
                              <View style={tw`items-center flex-1`}>
                                <Text style={tw`text-[3] text-gray-400`}>
                                  Pieces
                                </Text>
                                <Text
                                  style={tw`text-[4] font-bold text-gray-800`}
                                >
                                  {item.pieces}
                                </Text>
                              </View>
                            </View>

                            {/* Dates Row */}
                            <View
                              style={tw`flex-row justify-between items-center border-t border-gray-100 pt-2`}
                            >
                              <Text
                                style={tw`text-[2.8] text-red-500 font-medium`}
                              >
                                Expiry Date: {item.expiry_date}
                              </Text>
                              <Text
                                style={tw`text-[2.8] text-gray-400 font-medium`}
                              >
                                Inv. Date: {item.inventory_date}
                              </Text>
                            </View>
                          </View>
                        ))
                      )}
                    </ScrollView>
                  )}

                  {/* Add New Entry Trigger */}
                  <TouchableOpacity
                    onPress={() => setIsAddingEntry(true)}
                    style={tw`bg-transparent border-2 border-[#028543] p-4 rounded-xl items-center flex-row justify-center mb-2`}
                  >
                    <MaterialIcons
                      name="add"
                      size={22}
                      color="#028543"
                      style={tw`mr-2`}
                    />
                    <Text style={tw`text-[#028543] font-bold text-base`}>
                      Add New Entry
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={tw`bg-[#6C757D] p-4 rounded-xl items-center`}
                  >
                    <Text style={tw`text-white font-bold text-base`}>
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // ================= VIEW 2: FORM INPUT VIEW =================
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text
                    style={tw`text-[3.2] text-gray-400 font-bold uppercase mb-2`}
                  >
                    Stock Count
                  </Text>
                  <View style={tw`flex-row justify-between mb-6`}>
                    <View style={tw`flex-1 mr-1`}>
                      <Text style={tw`text-[3] text-gray-400 mb-1`}>Cases</Text>
                      <TextInput
                        keyboardType="numeric"
                        placeholder="0"
                        style={tw`border border-gray-200 rounded-xl p-3 bg-gray-50 text-center text-[4] font-bold`}
                        value={casesInput}
                        onChangeText={setCasesInput}
                      />
                    </View>
                    <View style={tw`flex-1 mx-1`}>
                      <Text style={tw`text-[3] text-gray-400 mb-1`}>
                        Inner Box
                      </Text>
                      <TextInput
                        keyboardType="numeric"
                        placeholder="0"
                        style={tw`border border-gray-200 rounded-xl p-3 bg-gray-50 text-center text-[4] font-bold`}
                        value={innerBoxInput}
                        onChangeText={setInnerBoxInput}
                      />
                    </View>
                    <View style={tw`flex-1 ml-1`}>
                      <Text style={tw`text-[3] text-gray-400 mb-1`}>
                        Pieces
                      </Text>
                      <TextInput
                        keyboardType="numeric"
                        placeholder="0"
                        style={tw`border border-gray-200 rounded-xl p-3 bg-gray-50 text-center text-[4] font-bold`}
                        value={piecesInput}
                        onChangeText={setPiecesInput}
                      />
                    </View>
                  </View>

                  <Text
                    style={tw`text-[3.2] text-gray-400 font-bold uppercase mb-2`}
                  >
                    Important Dates
                  </Text>

                  <TouchableOpacity
                    onPress={() => set_is_expiry_picker_show(true)}
                    style={tw`border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50 flex-row justify-between items-center`}
                  >
                    <View>
                      <Text style={tw`text-[3] text-gray-400 uppercase`}>
                        Expiry Date
                      </Text>
                      <Text style={tw`text-[4] font-semibold text-gray-800`}>
                        {formate_date(expiry_date, "mm/dd/yyyy")}
                      </Text>
                    </View>
                    <MaterialIcons name="event" size={24} color="#DE4343" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => set_is_inventory_picker_show(true)}
                    style={tw`border border-gray-200 rounded-xl p-4 mb-6 bg-gray-50 flex-row justify-between items-center`}
                  >
                    <View>
                      <Text style={tw`text-[3] text-gray-400 uppercase`}>
                        Inventory Date
                      </Text>
                      <Text style={tw`text-[4] font-semibold text-gray-800`}>
                        {formate_date(inventory_date, "mm/dd/yyyy")}
                      </Text>
                    </View>
                    <MaterialIcons name="inventory" size={24} color="#028543" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleAddEntrySubmit}
                    disabled={is_add_entry_loading}
                    style={tw`bg-[#028543] p-4 rounded-xl mt-4 items-center flex-row justify-center ${
                      is_add_entry_loading ? "opacity-50" : "opacity-100"
                    }`}
                  >
                    {is_add_entry_loading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={tw`text-white font-bold text-base`}>
                        Confirm Entry
                      </Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>

          {/* DateTimePickers */}
          {is_expiry_picker_show && (
            <DateTimePicker
              value={expiry_date || new Date()}
              mode="date"
              display="default"
              onChange={expiry_date_on_change}
            />
          )}
          {is_inventory_picker_show && (
            <DateTimePicker
              value={inventory_date || new Date()}
              mode="date"
              display="default"
              onChange={inventory_date_on_change}
            />
          )}
        </ModalReact>
      </View>
    </React.Fragment>
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

export default P11_NERM;
