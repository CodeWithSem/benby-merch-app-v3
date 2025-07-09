import React from "react";
import P1_TDS from "./C2_PAGES/P1_TDS";

const C2_MCP_MODULE = ({
  app_version,
  ui_navigation,
  set_ui_navigation,
  user_account_data,
  general_selected_mcp,
  set_general_selected_mcp,
  location,
  selected_diver_remarks,
  set_selected_diver_remarks,
  set_general_tds_timelog_link,
  set_general_storetimelog,
}) => {
  return (
    <React.Fragment>
      {user_account_data.b6_Type === "TDS" ? (
        <P1_TDS
          app_version={app_version}
          ui_navigation={ui_navigation}
          set_ui_navigation={set_ui_navigation}
          user_account_data={user_account_data}
          general_selected_mcp={general_selected_mcp}
          set_general_selected_mcp={set_general_selected_mcp}
          location={location}
          selected_diver_remarks={selected_diver_remarks}
          set_selected_diver_remarks={set_selected_diver_remarks}
          set_general_tds_timelog_link={set_general_tds_timelog_link}
          set_general_storetimelog={set_general_storetimelog}
        />
      ) : null}
      {/* {user_account_data.b6_Type === "DISER" ? (
        <A3_2_DISER_PAGE
          ui_control_condition={ui_control_condition}
          set_ui_control_condition={set_ui_control_condition}
          user_account_data={user_account_data}
          general_selected_sched={general_selected_sched}
          set_general_selected_sched={set_general_selected_sched}
          location={location}
          general_path_link_sched={general_path_link_sched}
          set_general_path_link_sched={set_general_path_link_sched}
          set_general_storetimelog={set_general_storetimelog}
        />
      ) : null} */}
    </React.Fragment>
  );
};

export default C2_MCP_MODULE;
