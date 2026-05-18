package com.daddyfilth.drivewayestimator;

import android.Manifest;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "DevicePermissions",
    permissions = {
        @Permission(
            alias = "camera",
            strings = {
                Manifest.permission.CAMERA
            }
        ),
        @Permission(
            alias = "photos",
            strings = {
                Manifest.permission.READ_MEDIA_IMAGES,
                Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED,
                Manifest.permission.READ_EXTERNAL_STORAGE
            }
        ),
        @Permission(
            alias = "location",
            strings = {
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            }
        ),
        @Permission(
            alias = "bluetooth",
            strings = {
                Manifest.permission.BLUETOOTH_SCAN,
                Manifest.permission.BLUETOOTH_CONNECT
            }
        )
    }
)
public class DevicePermissionsPlugin extends Plugin {
    @PluginMethod
    public void check(PluginCall call) {
        String alias = call.getString("permission", "");
        JSObject result = new JSObject();
        result.put("state", getPermissionStateForAlias(alias));
        call.resolve(result);
    }

    @PluginMethod
    public void request(PluginCall call) {
        String alias = call.getString("permission", "");

        if (isAutomaticallyGranted(alias) || getPermissionState(alias) == PermissionState.GRANTED) {
            JSObject result = new JSObject();
            result.put("state", "granted");
            call.resolve(result);
            return;
        }

        requestPermissionForAlias(alias, call, "permissionCallback");
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        String alias = call.getString("permission", "");
        JSObject result = new JSObject();
        result.put("state", getPermissionStateForAlias(alias));
        call.resolve(result);
    }

    private boolean isAutomaticallyGranted(String alias) {
        if ("bluetooth".equals(alias) && Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return true;
        }

        return false;
    }

    private String getPermissionStateForAlias(String alias) {
        if (isAutomaticallyGranted(alias)) {
            return "granted";
        }

        PermissionState state = getPermissionState(alias);
        return state == null ? "prompt" : state.toString();
    }
}
