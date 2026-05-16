import React, { useState, useEffect } from "react";
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
  const [form_data, set_form_data] = useState({});

  /**
   * STEPPER STATES:
   * 1: Pre-Deployment
   * 2: Training Prompt (YES/NO)
   * 3: New Disers Evaluation (Visible only if YES)
   * 4: Trade Findings Audit
   */
  const [current_step, set_current_step] = useState(1);
  const [is_undergoing_training, set_is_undergoing_training] = useState(null);

  useEffect(() => {
    if (is_open && tds_code && store_code) {
      fetch_survey();
      set_current_step(1);
      set_is_undergoing_training(null);
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
        const initial_state = {};
        raw_data.forEach((q) => {
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

  const update_answer = (id, value) => {
    set_form_data((prev) => ({ ...prev, [id]: value }));
  };

  const handle_next = () => {
    if (current_step === 1) {
      set_current_step(2);
    } else if (current_step === 2) {
      if (is_undergoing_training === "YES") {
        set_current_step(3); // Go to Evaluation
      } else {
        set_current_step(4); // Skip Step 3, go to Trade Findings
      }
    } else if (current_step === 3) {
      set_current_step(4);
    } else {
      handle_submit();
    }
  };

  const handle_back = () => {
    if (current_step === 4 && is_undergoing_training === "NO") {
      set_current_step(2); // Jump back to prompt if skipped Step 3
    } else {
      set_current_step((prev) => prev - 1);
    }
  };

  const handle_submit = () => {
    const date_now = format_date(new Date());

    const final_payload = questions
      .filter((q) => {
        if (q.module === "PRE DEPLOYMENT") return true;
        if (
          q.module === "NEW DISERS EVALUATION" &&
          is_undergoing_training === "YES"
        )
          return true;
        if (q.module === "TRADE FINDINGS AUDIT") return true;
        return false;
      })
      .map((q) => ({
        ...q,
        answer: form_data[q.id],
        survey_date: date_now,
        is_training: is_undergoing_training,
        plantilla_code: selected_merch_data?.plantillaCode || "",
      }));

    on_complete(final_payload);
  };

  const render_questions_by_module = (module_name) => {
    const filtered = questions.filter((q) => q.module === module_name);
    return filtered.map((item) => (
      <View
        key={item.id}
        style={tw`flex-row items-center justify-between mb-4 px-1`}
      >
        <Text style={tw`flex-1 text-sm text-gray-700 mr-3`}>{item.survey}</Text>
        {module_name === "PRE DEPLOYMENT" ? (
          <TouchableOpacity
            onPress={() =>
              update_answer(item.id, form_data[item.id] === "1" ? "" : "1")
            }
            style={tw`h-8 w-8 items-center justify-center`}
          >
            <View
              style={tw`h-6 w-6 border-2 rounded-md items-center justify-center ${form_data[item.id] === "1" ? "bg-[#028543] border-[#028543]" : "border-gray-300"}`}
            >
              {form_data[item.id] === "1" && (
                <Ionicons name="checkmark" size={18} color="white" />
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <View
            style={tw`bg-gray-100 rounded-lg border border-gray-200 w-36 justify-center`}
          >
            <Picker
              selectedValue={form_data[item.id]}
              style={tw`h-12 w-full`}
              onValueChange={(val) => update_answer(item.id, val)}
              mode="dropdown"
            >
              <Picker.Item label="GOOD" value="GOOD" />
              <Picker.Item label="MINIMUM" value="MINIMUM" />
              <Picker.Item label="BAD" value="BAD" />
            </Picker>
          </View>
        )}
      </View>
    ));
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
          {/* STEP 1: PRE DEPLOYMENT */}
          {current_step === 1 && (
            <View>
              <View style={tw`bg-green-700 px-3 py-2 rounded-lg mb-4`}>
                <Text style={tw`text-white font-bold text-xs uppercase`}>
                  STEP 1: PRE-DEPLOYMENT
                </Text>
              </View>
              {render_questions_by_module("PRE DEPLOYMENT")}
            </View>
          )}

          {/* STEP 2: PROMPT QUESTION */}
          {current_step === 2 && (
            <View style={tw`py-10 items-center`}>
              <Text
                style={tw`text-lg text-center font-bold text-gray-700 mb-6`}
              >
                Is the Diser undergoing training?
              </Text>
              <View style={tw`flex-row w-full justify-around`}>
                <TouchableOpacity
                  onPress={() => set_is_undergoing_training("YES")}
                  style={tw`w-[40%] p-4 rounded-xl items-center ${is_undergoing_training === "YES" ? "bg-green-600" : "bg-gray-200"}`}
                >
                  <Text
                    style={tw`${is_undergoing_training === "YES" ? "text-white" : "text-gray-700"} font-bold`}
                  >
                    YES
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => set_is_undergoing_training("NO")}
                  style={tw`w-[40%] p-4 rounded-xl items-center ${is_undergoing_training === "NO" ? "bg-red-600" : "bg-gray-200"}`}
                >
                  <Text
                    style={tw`${is_undergoing_training === "NO" ? "text-white" : "text-gray-700"} font-bold`}
                  >
                    NO
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: NEW DISERS EVALUATION (Visible only if YES) */}
          {current_step === 3 && is_undergoing_training === "YES" && (
            <View>
              <View style={tw`bg-green-700 px-3 py-2 rounded-lg mb-4`}>
                <Text style={tw`text-white font-bold text-xs uppercase`}>
                  STEP 2: NEW DISERS EVALUATION
                </Text>
              </View>
              {render_questions_by_module("NEW DISERS EVALUATION")}
            </View>
          )}

          {/* STEP 4: TRADE FINDINGS AUDIT */}
          {current_step === 4 && (
            <View>
              <View style={tw`bg-green-700 px-3 py-2 rounded-lg mb-4`}>
                <Text style={tw`text-white font-bold text-xs uppercase`}>
                  {is_undergoing_training === "YES" ? "STEP 3" : "STEP 2"}:
                  TRADE FINDINGS AUDIT
                </Text>
              </View>
              {render_questions_by_module("TRADE FINDINGS AUDIT")}
            </View>
          )}
        </ScrollView>

        {/* Footer Navigation */}
        <View style={tw`flex-row justify-between mt-4`}>
          {current_step > 1 && (
            <TouchableOpacity
              onPress={handle_back}
              style={tw`bg-gray-400 p-4 rounded-xl flex-1 mr-2 items-center`}
            >
              <Text style={tw`text-white font-bold`}>BACK</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handle_next}
            disabled={current_step === 2 && !is_undergoing_training}
            style={tw`${current_step === 2 && !is_undergoing_training ? "bg-gray-300" : "bg-[#028543]"} p-4 rounded-xl flex-2 items-center shadow-md`}
          >
            <Text style={tw`text-white font-bold text-lg`}>
              {current_step === 4 ? "SUBMIT SURVEY" : "NEXT"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default Training_Survey;
