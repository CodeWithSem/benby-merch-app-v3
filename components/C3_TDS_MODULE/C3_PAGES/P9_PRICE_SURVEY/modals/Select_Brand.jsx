import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  FlatList,
} from "react-native";
import { Modal } from "../../../../../assets/elements/Modal"; // Using your custom Modal component
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import tw from "twrnc";

const Select_Brand = ({
  is_open,
  set_display_modal,
  search_brand,
  set_search_brand,
  brand_data,
  set_selected_brand,
}) => {
  return (
    <Modal isOpen={is_open}>
      <View style={tw`bg-white w-full rounded-xl`}>
        {/* Header */}
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
            <Pressable onPress={() => set_display_modal("")}>
              <Ionicons name="close" size={32} color={"#028543"} />
            </Pressable>
          </View>
        </View>

        {/* Search Input */}
        <View style={tw`flex w-full flex flex-row px-4 mt-[20]`}>
          <View
            style={tw`h-[12] pl-[15] flex flex-row justify-center bg-[#fff] rounded-lg border-[0.5] border-[#028543] w-full`}
          >
            <TextInput
              value={search_brand}
              placeholder="Search..."
              placeholderTextColor={`gray`}
              style={tw`flex-1 text-[4.4]`}
              onChangeText={(text) => set_search_brand(text)}
            />
            <View style={tw`justify-center items-center w-[12] pb-[1]`}>
              <FontAwesome name="search" size={24} color={"#028543"} />
            </View>
          </View>
        </View>
        {/* List Section */}
        <View style={tw`pl-3 pr-2 py-3 h-[60]`}>
          <FlatList
            data={brand_data}
            style={tw`px-3`}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => {
              return (
                <TouchableOpacity
                  style={tw`flex justify-center bg-[#fff] h-[12] rounded-md my-1`}
                  onPress={() => {
                    set_selected_brand(item);
                    setTimeout(() => {
                      set_display_modal("");
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

        {/* Footer Action */}
        <View style={tw`w-full p-3`}>
          <TouchableOpacity
            style={tw`w-full bg-[#6C757D] p-3 rounded-lg`}
            onPress={() => set_display_modal("")}
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
  );
};

export default Select_Brand;
