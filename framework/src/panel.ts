// 界面模块

import { SimpleFSM } from "./state-sfsm";
import { TAG } from "./tool";
import { load_res } from "./tool-ccc";

/**
 * 界面类型
 * - new 新创建一个页面
 * - old 寻找旧页面，将 node.active 置为 true
 */
type PanelType = "new" | "old";

/**
 * 节点状态
 * - open 打开状态
 * - close 关闭状态
 * - 注意：为当前状态描述，无视打开关闭动画
 */
type PanelState = "open" | "close";

type PanelContext = {
  /** prefab 的路径 */
  path: string;
  /** zindex 的基础值 */
  z_index_base: number;
  /** prefab */
  prefab: cc.Prefab;
  /** 示例 */
  ins: PanelBase;
  /** 类别 */
  type: PanelType;
  /** 当前状态 */
  state: SimpleFSM<PanelState>;
};

/** 父节点 */
let parent: cc.Node = null;

/** 当前节点的 node.zIndex */
let now_z_index: number = 0;

/** 界面脚本的实现基类 */
export abstract class PanelBase extends cc.Component {
  /** 界面的上下文信息 */
  static context: PanelContext = null;
  /** 界面首次打开执行函数，处理只执行 1 次的逻辑，比如创建 */
  abstract async on_create(): Promise<void>;
  /** 界面打开函数，处理动画和逻辑，会在 onLoad 之后，start 之前执行 */
  abstract async on_open(...params: any[]): Promise<void>;
  /** 界面关闭函数，处理动画和逻辑，会在 onDestroy 之前执行 */
  abstract async on_close(...params: any[]): Promise<void>;
}

/**
 * 设置 panel 类上下文的装饰器
 * @param config
 */
export const DeSetPanelContext = (path: string, type = "old", z_index_base = 0) => {
  return (constructor: typeof PanelBase) => {
    constructor.context = {
      path: path,
      z_index_base: z_index_base,
      type: type as PanelType,
      prefab: null,
      ins: null,
      state: new SimpleFSM<PanelState>("close", {
        open: ["close"],
        close: ["open"],
      }),
    };
  };
};

/** panel 的子类 */
type PanelClass = typeof PanelBase;

/** panel 子类的 on_open 方法参数 */
type ParamPanelOpen<T extends PanelClass> = Parameters<T["prototype"]["on_open"]>;

/** panel 子类的 on_close 方法参数 */
type ParamPanelClose<T extends PanelClass> = Parameters<T["prototype"]["on_close"]>;

/**
 * 初始化系统，传入父节点
 * @param node
 */
export const _init_panel_runtime = (node: cc.Node) => {
  parent = node;
  cc.log(TAG, "初始化panel模块成功，panel_parent=", node);
};

/**
 * 预载入界面 prefab
 * @param panel
 */
export const pre_panel = async (panel: PanelClass) => {
  if (!panel.context.prefab) {
    panel.context.prefab = await load_res(panel.context.path, cc.Prefab);
  }
};

/**
 * 获取界面实例，如果获取不到，则创建新的
 * @param panel
 */
const get_panel = async (panel: PanelClass) => {
  await pre_panel(panel);
  if (!panel.context.ins) {
    let node = cc.instantiate(panel.context.prefab);
    node.parent = parent;
    node.position = cc.Vec3.ZERO;
    node.width = cc.winSize.width;
    node.height = cc.winSize.height;
    panel.context.ins = node.getComponent(panel);
    await panel.context.ins.on_create();
  }
  return panel.context.ins;
};

/**
 * 打开页面
 * @param panel
 * @param params
 */
export const open_panel = async <T extends PanelClass>(panel: T, ...params: ParamPanelOpen<T>) => {
  // 校验
  if (!panel.context.state.try_go_state("open")) {
    return;
  }
  // 载入
  let z_index = (now_z_index += 1);
  let ins = await get_panel(panel);
  ins.node.zIndex = z_index + panel.context.z_index_base;
  ins.node.active = true;
  // 动画
  await panel.context.ins.on_open(...params);
};

/**
 * 关闭页面
 * @param panel
 * @param params
 */
export const close_panel = async <T extends PanelClass>(
  panel: T,
  ...params: ParamPanelClose<T>
) => {
  // 校验
  if (!panel.context.state.try_go_state("close")) {
    return;
  }
  // 删除实例
  await panel.context.ins.on_close(...params);
  if (panel.context.type === "new") {
    panel.context.ins.node.destroy();
    panel.context.ins = null;
  } else if (panel.context.type === "old") {
    panel.context.ins.node.active = false;
  }
};
