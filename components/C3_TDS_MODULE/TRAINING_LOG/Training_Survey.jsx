import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { Modal } from "../../../assets/elements/Modal";
import { ref, get } from "firebase/database";
import { db } from "../../../assets/scripts/firebase";
import { format_date } from "../../../assets/scripts/functions/format_value";

const Training_Survey = ({
  is_open,
  tds_code,
  store_code,
  selected_merch_data,
  on_cancel,
  on_complete,
}) => {
  const [questions, set_questions] = useState([]);
  const [current_index, set_current_index] = useState(0);
  const [loading, set_loading] = useState(false);
  const [answers, set_answers] = useState([]);

  // Fetch questions from Firebase
  useEffect(() => {
    if (is_open && tds_code && store_code) {
      set_loading(true);
      const survey_ref = ref(
        db,
        `DB_TEST/TBL_TRAINING_LOG/DATA/${tds_code}/${store_code}`,
      );

      get(survey_ref)
        .then((snapshot) => {
          if (snapshot.exists()) {
            // I-convert ang object to array at i-sort base sa row_no
            const data = Object.values(snapshot.val()).sort(
              (a, b) => a.id - b.id,
            );
            set_questions(data);
          }
          set_loading(false);
        })
        .catch((err) => {
          console.error("Error fetching survey:", err);
          set_loading(false);
        });
    } else {
      // Reset state pag sinara
      set_current_index(0);
      set_answers([]);
    }
  }, [is_open]);

  const handle_answer = (value) => {
    const date_now = new Date();
    const current_q = questions[current_index];
    const new_answer = {
      ...current_q,
      answer: value,
      survey_date: format_date(date_now),
      plantilla_code: selected_merch_data.plantillaCode,
    };
    const updated_answers = [...answers, new_answer];

    set_answers(updated_answers);

    if (current_index < questions.length - 1) {
      set_current_index(current_index + 1);
    } else {
      // Tapos na lahat ng questions
      on_complete(updated_answers);
    }
  };

  if (loading)
    return (
      <Modal isOpen={is_open}>
        <ActivityIndicator size="large" color="#028543" />
      </Modal>
    );

  const current_q = questions[current_index];

  return (
    <Modal isOpen={is_open}>
      <View style={tw`bg-white w-full rounded-2xl p-6`}>
        {current_q ? (
          <View>
            {/* Progress Header */}
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text
                style={tw`text-xs font-bold text-gray-400 uppercase tracking-widest`}
              >
                Question {current_index + 1} of {questions.length}
              </Text>
              <TouchableOpacity onPress={on_cancel}>
                <Ionicons name="close" size={24} color="#ccc" />
              </TouchableOpacity>
            </View>

            {/* Module Label */}
            <View
              style={tw`bg-green-100 self-start px-3 py-1 rounded-full mb-3`}
            >
              <Text style={tw`text-[10px] font-bold text-green-700`}>
                {current_q.module}
              </Text>
            </View>

            {/* Survey Question */}
            <Text style={tw`text-xl font-bold text-gray-800 mb-8 leading-7`}>
              {current_q.survey}
            </Text>

            {/* Buttons */}
            <View style={tw`flex-row gap-4`}>
              <TouchableOpacity
                onPress={() => handle_answer("YES")}
                style={tw`flex-1 bg-[#028543] p-4 rounded-xl items-center`}
              >
                <Text style={tw`text-white font-bold text-lg`}>YES</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handle_answer("NO")}
                style={tw`flex-1 bg-red-500 p-4 rounded-xl items-center`}
              >
                <Text style={tw`text-white font-bold text-lg`}>NO</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={tw`items-center py-10`}>
            <Text style={tw`text-gray-400`}>
              No questions available for this store.
            </Text>
            <TouchableOpacity onPress={on_cancel} style={tw`mt-4`}>
              <Text style={tw`text-green-600 font-bold`}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

export default Training_Survey;
