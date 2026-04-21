import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import tw from "twrnc";
import { Modal } from "../../../assets/elements/Modal";
import { ref, get } from "firebase/database";
import { db } from "../../../assets/scripts/firebase";
import { format_date } from "../../../assets/scripts/functions/format_value";
import { Ionicons } from "@expo/vector-icons";

const Training_Survey = ({
  is_open,
  tds_code,
  store_code,
  selected_merch_data,
  on_cancel,
  on_complete,
}) => {
  const [questions, set_questions] = useState([]);
  const [loading, set_loading] = useState(false);
  const [form_data, set_form_data] = useState({}); // Dito ise-save ang local state ng answers

  useEffect(() => {
    if (is_open && tds_code && store_code) {
      fetch_survey();
    } else {
      set_form_data({});
    }
  }, [is_open]);

  const fetch_survey = async () => {
    set_loading(true);
    try {
      const survey_ref = ref(
        db,
        `DB_TEST/TBL_TRAINING_LOG/DATA/${tds_code}/${store_code}`,
      );
      const snapshot = await get(survey_ref);

      if (snapshot.exists()) {
        const raw_data = Object.values(snapshot.val()).sort(
          (a, b) => a.id - b.id,
        );
        set_questions(raw_data);

        // Initialize form_data base sa structure ng questions
        const initial_state = {};
        raw_data.forEach((q) => {
          // Kung PRE DEPLOYMENT, default ay "" (unchecked)
          // Kung iba, default ay "GOOD" o pwedeng "" kung gusto mong pilitin sila mamili
          initial_state[q.id] =
            q.answer || (q.module === "PRE DEPLOYMENT" ? "" : "GOOD");
        });
        set_form_data(initial_state);
      }
    } catch (err) {
      console.error("Error fetching survey:", err);
    } finally {
      set_loading(false);
    }
  };

  // I-group ang questions base sa module name
  const grouped_questions = useMemo(() => {
    return questions.reduce((acc, obj) => {
      const key = obj.module;
      if (!acc[key]) acc[key] = [];
      acc[key].push(obj);
      return acc;
    }, {});
  }, [questions]);

  const update_answer = (id, value) => {
    set_form_data((prev) => ({ ...prev, [id]: value }));
  };

  const handle_submit = () => {
    const date_now = format_date(new Date());

    // I-map pabalik ang mga sagot sa original array structure
    const final_payload = questions.map((q) => ({
      ...q,
      answer: form_data[q.id],
      survey_date: date_now,
      plantilla_code: selected_merch_data?.plantillaCode || "",
    }));

    console.log(JSON.parse(JSON.stringify(final_payload)));

    on_complete(JSON.parse(JSON.stringify(final_payload)));
  };

  if (loading) {
    return (
      <Modal isOpen={is_open}>
        <ActivityIndicator size="large" color="#028543" />
      </Modal>
    );
  }

  return (
    <Modal isOpen={is_open}>
      <View style={tw`bg-white w-full h-[90%] rounded-2xl p-4`}>
        {/* Header */}
        <View
          style={tw`flex-row justify-between items-center mb-4 border-b border-gray-100 pb-2`}
        >
          <Text style={tw`text-lg font-bold text-gray-800`}>
            Training Survey
          </Text>
          <TouchableOpacity onPress={on_cancel}>
            <Ionicons name="close-circle" size={28} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={tw`flex-1`}>
          {Object.keys(grouped_questions).length > 0 ? (
            Object.entries(grouped_questions).map(([module_name, items]) => (
              <View key={module_name} style={tw`mb-6`}>
                {/* Module Title */}
                <View style={tw`bg-green-700 px-3 py-2 rounded-lg mb-3`}>
                  <Text style={tw`text-white font-bold text-xs uppercase`}>
                    {module_name}
                  </Text>
                </View>

                {items.map((item) => (
                  <View
                    key={item.id}
                    style={tw`flex-row items-center justify-between mb-4 px-1`}
                  >
                    <Text style={tw`flex-1 text-sm text-gray-700 mr-3`}>
                      {item.survey}
                    </Text>

                    {module_name === "PRE DEPLOYMENT" ? (
                      <TouchableOpacity
                        onPress={() =>
                          update_answer(
                            item.id,
                            form_data[item.id] === "1" ? "" : "1",
                          )
                        }
                        style={tw`h-8 w-8 items-center justify-center`} // Container size
                      >
                        <View
                          style={tw`h-6 w-6 border-2 rounded-md items-center justify-center ${form_data[item.id] === "1" ? "bg-[#028543] border-[#028543]" : "border-gray-300"}`}
                        >
                          {form_data[item.id] === "1" && (
                            <Ionicons
                              name="checkmark"
                              size={18} // DITO MO MA-AADJUST ANG LAKI NG CHECK MISMO
                              color="white"
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <View
                        style={tw`bg-gray-100 rounded-lg border border-gray-200 w-36 justify-center`}
                      >
                        <Picker
                          selectedValue={form_data[item.id]}
                          style={[
                            tw`h-12 w-full`,
                            { color: "#374151" }, // Kulay ng text (Gray-700)
                          ]}
                          dropdownIconColor="#028543" // Kulay ng arrow
                          onValueChange={(val) => update_answer(item.id, val)}
                          // Mahalaga ito para sa Android para hindi mag-overlap ang text
                          mode="dropdown"
                        >
                          <Picker.Item
                            label="GOOD"
                            value="GOOD"
                            style={{ fontSize: 14 }}
                          />
                          <Picker.Item
                            label="MINIMUM"
                            value="MINIMUM"
                            style={{ fontSize: 14 }}
                          />
                          <Picker.Item
                            label="BAD"
                            value="BAD"
                            style={{ fontSize: 14 }}
                          />
                        </Picker>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ))
          ) : (
            <Text style={tw`text-center text-gray-400 mt-10`}>
              No survey questions found.
            </Text>
          )}
        </ScrollView>

        {/* Action Button */}
        {questions.length > 0 && (
          <TouchableOpacity
            onPress={handle_submit}
            style={tw`bg-[#028543] p-4 rounded-xl items-center mt-4 shadow-md`}
          >
            <Text style={tw`text-white font-bold text-lg`}>SUBMIT SURVEY</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

export default Training_Survey;
