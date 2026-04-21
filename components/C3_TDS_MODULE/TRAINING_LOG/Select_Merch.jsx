import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { Modal } from "../../../assets/elements/Modal";
import { ref, onValue } from "firebase/database";
import { db } from "../../../assets/scripts/firebase";

const Select_Merch = ({
  is_open,
  selected_store_code,
  on_cancel,
  on_confirm, // Para sa <= tenure limit
  on_save, // Para sa > tenure limit
}) => {
  const [step, set_step] = useState(1);
  const [loading, set_loading] = useState(false);
  const [agencies, set_agencies] = useState([]);
  const [all_merchandisers, set_all_merchandisers] = useState([]);
  const [selected_agency_name, set_selected_agency_name] = useState("");

  // --- Dynamic Tenure Limit State ---
  const [tenure_limit, set_tenure_limit] = useState(6);

  // Fetch Tenure Limit from RTDB
  useEffect(() => {
    const limitRef = ref(
      db,
      "DB2_BENBY_MERCH_APP/TBL_MAINTAINABLE/TENURE/VALUE",
    );
    const unsubscribe = onValue(limitRef, (snap) => {
      if (snap.exists()) {
        set_tenure_limit(parseInt(snap.val()));
      }
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  useEffect(() => {
    if (is_open) {
      set_loading(true);
      const agencyRef = ref(db, "DB_TEST/TBL_AGENCY/DATA");
      onValue(agencyRef, (snap) => {
        if (snap.exists()) {
          set_agencies(Object.values(snap.val()).filter(Boolean));
        }
        set_loading(false);
      });
    } else {
      set_step(1);
      set_selected_agency_name("");
    }
  }, [is_open]);

  useEffect(() => {
    if (step === 2 && selected_store_code) {
      set_loading(true);
      const merchRef = ref(
        db,
        `DB_TEST/TBL_MERCHANDISER/DATA/${selected_store_code}`,
      );
      onValue(merchRef, (snap) => {
        if (snap.exists()) {
          const list = Object.values(snap.val()).filter(
            (item) => typeof item === "object",
          );
          set_all_merchandisers(list);
        } else {
          set_all_merchandisers([]);
        }
        set_loading(false);
      });
    }
  }, [step, selected_store_code]);

  const handle_selection = (merch) => {
    if (!merch.hiringDate) {
      alert("No hiring date found for this merchandiser.");
      return;
    }

    const [m, d, y] = merch.hiringDate.split("/");
    const hire_date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const date_now = new Date();

    let diff_in_months =
      (date_now.getFullYear() - hire_date.getFullYear()) * 12;
    diff_in_months += date_now.getMonth() - hire_date.getMonth();

    if (date_now.getDate() < hire_date.getDate()) {
      diff_in_months--;
    }

    const final_tenure = Math.max(0, diff_in_months);

    console.log(
      `Tenure of ${merch.merchandiserFullName}: ${final_tenure} months (Limit: ${tenure_limit})`,
    );

    // Dynamic comparison using the value from Firebase
    if (final_tenure <= tenure_limit) {
      on_confirm(merch);
    } else {
      on_save(merch);
    }
  };

  const filtered_merch = all_merchandisers.filter(
    (m) => m.agency?.toUpperCase() === selected_agency_name?.toUpperCase(),
  );

  const render_item = ({ item }) => (
    <TouchableOpacity
      style={tw`p-4 border-b border-gray-100 flex-row justify-between items-center bg-white`}
      onPress={() =>
        step === 1
          ? (set_selected_agency_name(item.agency), set_step(2))
          : handle_selection(item)
      }
    >
      <View style={tw`flex-1`}>
        {step === 2 && (
          <Text style={tw`text-xs text-gray-500 mb-1`}>
            {item.plantillaCode}
          </Text>
        )}
        <Text style={tw`text-base font-bold text-gray-800`}>
          {step === 1 ? item.agency : item.merchandiserFullName}
        </Text>
        {step === 2 && (
          <Text style={tw`text-xs text-gray-500 mt-1`}>
            Hiring Date: {item.hiringDate}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#028543" />
    </TouchableOpacity>
  );

  return (
    <Modal isOpen={is_open}>
      <View style={tw`bg-gray-50 w-full h-[50%] rounded-2xl overflow-hidden`}>
        <View
          style={tw`bg-white p-5 border-b border-gray-200 flex-row justify-between items-center`}
        >
          <View style={tw`flex-row items-center`}>
            {step === 2 && (
              <TouchableOpacity onPress={() => set_step(1)} style={tw`mr-3`}>
                <Ionicons name="arrow-back" size={24} color="#028543" />
              </TouchableOpacity>
            )}
            <View>
              <Text style={tw`text-lg font-bold text-gray-900`}>
                {step === 1 ? "Select Agency" : "Select Merchandiser"}
              </Text>
              {step === 2 && (
                <Text
                  style={tw`text-[10px] text-green-700 font-bold uppercase`}
                >
                  {selected_agency_name}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={on_cancel}>
            <Ionicons name="close-circle" size={32} color="#E5E7EB" />
          </TouchableOpacity>
        </View>

        <View style={tw`flex-1`}>
          {loading ? (
            <ActivityIndicator size="large" color="#028543" style={tw`mt-20`} />
          ) : (
            <FlatList
              data={step === 1 ? agencies : filtered_merch}
              keyExtractor={(_, index) => index.toString()}
              renderItem={render_item}
              ListEmptyComponent={
                <View style={tw`mt-10 items-center`}>
                  <Ionicons name="search-outline" size={40} color="#D1D5DB" />
                  <Text style={tw`text-center text-gray-400 mt-2`}>
                    No records found.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default Select_Merch;
