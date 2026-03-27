import React from "react";
import tw from "twrnc";
import { Modal } from "../../../assets/elements/Modal";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const With_Updated_Diser = ({ is_open, on_cancel, on_yes, on_no }) => {
  // RETURN ORIGIN
  return (
    <React.Fragment>
      <Modal isOpen={is_open}>
        <View style={tw`bg-white w-full rounded-xl`}>
          <View
            style={tw`flex flex-row justify-center items-center mt-[15] pl-5`}
          >
            <View style={tw`flex-5`}></View>
            <View style={tw`flex flex-1 justify-center items-center pr-1`}>
              <TouchableOpacity onPress={on_cancel}>
                <Ionicons name="close-circle" size={32} color="#E5E7EB" />
              </TouchableOpacity>
            </View>
          </View>
          <View
            style={tw`flex Justify-center items-center w-full flex gap-4 px-3 my-[20]`}
          >
            <Text style={tw`text-base`}>With Updated Diser?</Text>
          </View>
          <View style={tw`w-full flex flex-row gap-2 p-3`}>
            <TouchableOpacity
              style={tw`flex-1 bg-[#028543] p-3 rounded-lg`}
              onPress={on_yes}
            >
              <Text
                style={tw`text-lg font-bold tracking-wider text-white text-center`}
              >
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 bg-gray-100 border border-gray-300 p-3 rounded-lg`}
              onPress={on_no}
            >
              <Text
                style={tw`text-lg font-bold tracking-wider text-gray-500 text-center`}
              >
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </React.Fragment>
  );
};

export default With_Updated_Diser;
