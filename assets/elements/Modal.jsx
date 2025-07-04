import {
  Modal as RNModal,
  KeyboardAvoidingView,
  View,
  Platform,
} from "react-native";
import tw from "twrnc";

export const Modal = ({ isOpen, withInput, children, ...rest }) => {
  const content = withInput ? (
    <KeyboardAvoidingView
      style={tw`items-center justify-center flex-1 px-3 bg-zinc-900/40`}
      behavior={Platform.OS === "ios" ? "height" : "padding"}
    >
      {children}
    </KeyboardAvoidingView>
  ) : (
    <View style={tw`items-center justify-center flex-1 px-3 bg-zinc-900/40`}>
      {children}
    </View>
  );

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      {...rest}
    >
      {content}
    </RNModal>
  );
};
