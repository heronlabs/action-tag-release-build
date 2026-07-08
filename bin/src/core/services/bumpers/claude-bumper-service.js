"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeService = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
class ClaudeService {
    cwd;
    pluginDir;
    bump(version) {
        try {
            const pluginJson = (0, node_path_1.join)(this.cwd, this.pluginDir, 'plugin.json');
            const hasPlugin = (0, node_fs_1.existsSync)(pluginJson);
            if (!hasPlugin) {
                return {
                    ok: false,
                    error: new Error(`plugin.json not found at ${pluginJson}`),
                };
            }
            const marketplaceJson = (0, node_path_1.join)(this.cwd, this.pluginDir, 'marketplace.json');
            const hasMarketplace = (0, node_fs_1.existsSync)(marketplaceJson);
            if (!hasMarketplace) {
                return {
                    ok: false,
                    error: new Error(`marketplace.json not found at ${marketplaceJson}`),
                };
            }
            const plugin = JSON.parse((0, node_fs_1.readFileSync)(pluginJson, 'utf8'));
            const pluginName = plugin.name;
            if (!pluginName) {
                return {
                    ok: false,
                    error: new Error('plugin.json exists but has no .name field'),
                };
            }
            if (plugin.version !== version) {
                plugin.version = version;
                (0, node_fs_1.writeFileSync)(pluginJson, JSON.stringify(plugin, null, 2) + '\n');
            }
            const marketplace = JSON.parse((0, node_fs_1.readFileSync)(marketplaceJson, 'utf8'));
            if (!marketplace.plugins) {
                return {
                    ok: false,
                    error: new Error("marketplace.json has no 'plugins' array"),
                };
            }
            const entry = marketplace.plugins.find(item => item.name === pluginName);
            if (!entry) {
                return {
                    ok: false,
                    error: new Error(`marketplace.json has no entry matching plugin name '${pluginName}'`),
                };
            }
            if (entry.version !== version) {
                entry.version = version;
                (0, node_fs_1.writeFileSync)(marketplaceJson, JSON.stringify(marketplace, null, 2) + '\n');
            }
            return { ok: true, data: 'OK' };
        }
        catch (error) {
            return { ok: false, error };
        }
    }
    constructor(cwd, pluginDir) {
        this.cwd = cwd;
        this.pluginDir = pluginDir;
    }
}
exports.ClaudeService = ClaudeService;
//# sourceMappingURL=claude-bumper-service.js.map