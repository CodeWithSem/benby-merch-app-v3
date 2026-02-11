import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import tw from "twrnc";

const Audit_Survey = ({
  is_open,
  set_display_modal,
  selected_item,
  as_data,
  set_as_data,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tempAnswers, setTempAnswers] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  const questions = selected_item?.survey_list || [];
  const currentQuestion = questions[currentIndex];

  // Logic to check if all questions are already answered
  useEffect(() => {
    if (is_open && selected_item) {
      const existingAnswers = selected_item.survey_list || [];
      setTempAnswers([...existingAnswers]);

      // Check if every question already has an answer saved
      const isAlreadyCompleted =
        existingAnswers.length > 0 &&
        existingAnswers.every((q) => q.answer === "YES" || q.answer === "NO");

      if (isAlreadyCompleted) {
        setIsReviewing(true); // Jump straight to the list
      } else {
        setIsReviewing(false); // Start from question 1
        setCurrentIndex(0);
      }

      setIsProcessing(false);
    }
  }, [is_open, selected_item]);

  const handleAnswer = (answer) => {
    let newAnswers = [...tempAnswers];
    newAnswers[currentIndex] = { ...currentQuestion, answer: answer };
    setTempAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsReviewing(true);
    }
  };

  const finalizeAudit = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const updatedData = as_data.map((item) => {
        if (item.id === selected_item.id) {
          return { ...item, survey_list: tempAnswers };
        }
        return item;
      });

      set_as_data(updatedData);
      setIsProcessing(false);
      set_display_modal(null);
    }, 800);
  };

  const handleRetry = () => {
    // Reset answers locally and start from the first question
    const resetAnswers = tempAnswers.map((q) => ({ ...q, answer: null }));
    setTempAnswers(resetAnswers);
    setCurrentIndex(0);
    setIsReviewing(false);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={is_open}
      onRequestClose={() => !isProcessing && set_display_modal(null)}
    >
      <View style={tw`flex-1 justify-end bg-black/20`}>
        <Pressable
          style={tw`absolute inset-0`}
          onPress={() => !isProcessing && set_display_modal(null)}
        />

        <View style={tw`bg-white rounded-t-3xl shadow-2xl max-h-[90%]`}>
          <View
            style={tw`w-12 h-1.5 bg-gray-200 rounded-full self-center mt-4 mb-2`}
          />

          <View style={tw`p-6`}>
            {isProcessing ? (
              <View style={tw`items-center py-10`}>
                <ActivityIndicator size="large" color="#028543" />
                <Text style={tw`mt-4 text-gray-500 font-medium`}>
                  Finalizing Audit...
                </Text>
              </View>
            ) : isReviewing ? (
              /* --- REVIEW SUMMARY SCREEN (Shows if already answered or finished steps) --- */
              <View>
                <Text style={tw`text-xl font-bold text-gray-800 mb-1`}>
                  {selected_item?.survey_list?.every((q) => q.answer)
                    ? "Audit Results"
                    : "Review Responses"}
                </Text>
                <Text
                  style={tw`text-gray-500 text-xs mb-5 uppercase tracking-tighter`}
                >
                  Target: {selected_item?.activity}
                </Text>

                <ScrollView style={tw`max-h-80 mb-6`}>
                  {tempAnswers.map((item, index) => (
                    <View
                      key={index}
                      style={tw`flex-row justify-between items-center py-4 border-b border-gray-100`}
                    >
                      <View style={tw`flex-1 pr-4`}>
                        <Text style={tw`text-gray-400 text-[10px] font-bold`}>
                          QUESTION {index + 1}
                        </Text>
                        <Text style={tw`text-gray-700 text-xs font-medium`}>
                          {item.question}
                        </Text>
                      </View>
                      <View
                        style={tw`${item.answer === "YES" ? "bg-green-100" : "bg-red-100"} px-4 py-1.5 rounded-lg`}
                      >
                        <Text
                          style={tw`text-xs font-black ${item.answer === "YES" ? "text-green-700" : "text-red-700"}`}
                        >
                          {item.answer || "N/A"}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <View style={tw`flex-row gap-x-3`}>
                  <TouchableOpacity
                    onPress={handleRetry}
                    style={tw`flex-1 py-4 bg-gray-100 rounded-2xl items-center`}
                  >
                    <Text style={tw`text-gray-600 font-bold`}>Retry</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={finalizeAudit}
                    style={tw`flex-2 py-4 bg-[#028543] rounded-2xl items-center`}
                  >
                    <Text style={tw`text-white font-bold text-lg`}>
                      Confirm
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* --- STEP-BY-STEP QUESTION SCREEN --- */
              <>
                <View style={tw`flex-row justify-between items-center mb-1`}>
                  <Text style={tw`text-xl font-bold text-gray-800`}>
                    Perform Audit
                  </Text>
                  <Text style={tw`text-[#028543] font-bold text-xs`}>
                    {currentIndex + 1} / {questions.length}
                  </Text>
                </View>

                <Text style={tw`text-gray-500 text-sm mb-6`}>
                  Target:{" "}
                  <Text style={tw`font-bold text-gray-700`}>
                    {selected_item?.activity}
                  </Text>
                </Text>

                <View style={tw`h-1.5 w-full bg-gray-100 rounded-full mb-8`}>
                  <View
                    style={[
                      tw`h-full bg-[#028543] rounded-full`,
                      {
                        width: `${((currentIndex + 1) / questions.length) * 100}%`,
                      },
                    ]}
                  />
                </View>

                <View
                  style={tw`min-h-[120px] justify-center items-center bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-200`}
                >
                  <Text
                    style={tw`text-sm font-semibold text-gray-800 text-center`}
                  >
                    {currentQuestion?.question}
                  </Text>
                </View>

                <View style={tw`flex-row gap-x-3 mt-8 mb-4`}>
                  <TouchableOpacity
                    onPress={() => handleAnswer("YES")}
                    style={tw`flex-1 flex-row items-center justify-center p-5 rounded-2xl border-2 border-green-100 bg-green-50`}
                  >
                    <Text style={tw`font-black text-green-700 text-lg`}>
                      YES
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleAnswer("NO")}
                    style={tw`flex-1 flex-row items-center justify-center p-5 rounded-2xl border-2 border-red-100 bg-red-50`}
                  >
                    <Text style={tw`font-black text-red-700 text-lg`}>NO</Text>
                  </TouchableOpacity>
                </View>

                <View style={tw`flex-row gap-x-3 mt-2`}>
                  {currentIndex > 0 && (
                    <TouchableOpacity
                      onPress={() => setCurrentIndex(currentIndex - 1)}
                      style={tw`flex-1 py-4 bg-gray-100 rounded-2xl items-center`}
                    >
                      <Text style={tw`text-gray-600 font-bold`}>Previous</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => set_display_modal(null)}
                    style={tw`flex-1 py-4 bg-gray-50 rounded-2xl items-center border border-gray-200`}
                  >
                    <Text style={tw`text-gray-400 font-bold`}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default Audit_Survey;
