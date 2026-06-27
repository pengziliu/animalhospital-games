#!/bin/bash

# ============================================
# animalhospital-games — Cloudflare Pages 部署脚本
# ============================================
# 用法：
#   ./deploy.sh              # 构建 + 部署到生产
#   ./deploy.sh build        # 仅构建（不部署）
#   ./deploy.sh deploy       # 仅部署（用已有 out/）
#   ./deploy.sh status       # 查看 Pages 项目列表
#   ./deploy.sh preview      # 本地预览 out/ (wrangler pages dev)
#
# 说明：
#   本项目是 Next.js 静态导出（output: "export"），构建产物在 out/。
#   不需要 @cloudflare/next-on-pages 适配（那是动态 SSR 才需要的）。
#   直接 wrangler pages deploy out 即可。
# ============================================

# ---- Cloudflare 凭据（来自 hairtryon-cloudflare 参考）----
export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-dp52oPSkAoK8sWWJDFWWviy9_nJwNPvX5xE2FTy3}"
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-8d817ebb921f1248c2f251595c501e27}"

# ---- 项目配置 ----
PROJECT_NAME="animalhospital-games"
PRODUCTION_BRANCH="main"
OUTPUT_DIR="out"
SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://animalhospital.games}""

# ---- 颜色 ----
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error()   { echo -e "${RED}✗ $1${NC}"; }
print_info()    { echo -e "${BLUE}ℹ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_separator() { echo -e "${BLUE}────────────────────────────────────────────────────────${NC}"; }

check_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    print_error "$1 未安装，请先安装"
    exit 1
  fi
}

# ---- 构建前端 ----
build_frontend() {
  print_separator
  print_info "开始构建 Next.js 静态导出"
  print_separator

  if [ ! -d "node_modules" ]; then
    print_info "安装依赖..."
    npm install --legacy-peer-deps
  fi

  print_info "执行 npm run build（STATIC_EXPORT=1 + postbuild）..."
  NEXT_PUBLIC_SITE_URL="$SITE_URL" npm run build

  if [ $? -ne 0 ]; then
    print_separator
    print_error "构建失败"
    print_separator
    return 1
  fi

  # 验证关键产物
  local missing=0
  for f in "$OUTPUT_DIR/index.html" "$OUTPUT_DIR/codes/index.html" "$OUTPUT_DIR/sitemap.xml" "$OUTPUT_DIR/robots.txt"; do
    if [ ! -f "$f" ]; then
      print_error "缺失构建产物：$f"
      missing=1
    fi
  done
  if [ $missing -ne 0 ]; then
    print_error "构建产物校验失败"
    return 1
  fi

  print_success "构建成功，产物在 $OUTPUT_DIR/"
  return 0
}

# ---- 部署到 Cloudflare Pages ----
deploy_frontend() {
  print_separator
  print_info "部署到 Cloudflare Pages（项目: $PROJECT_NAME）"
  print_separator

  if [ ! -d "$OUTPUT_DIR" ]; then
    print_error "未找到 $OUTPUT_DIR/，请先构建"
    return 1
  fi

  # 确认项目存在，不存在则创建
  if ! npx wrangler pages project list 2>/dev/null | grep -q "^│ $PROJECT_NAME "; then
    print_warning "Pages 项目 $PROJECT_NAME 不存在，自动创建..."
    npx wrangler pages project create "$PROJECT_NAME" --production-branch="$PRODUCTION_BRANCH"
    if [ $? -ne 0 ]; then
      print_error "项目创建失败"
      return 1
    fi
    print_success "项目创建成功"
  fi

  print_info "上传 $OUTPUT_DIR/ 到生产分支 $PRODUCTION_BRANCH..."
  npx wrangler pages deploy "$OUTPUT_DIR" \
    --project-name="$PROJECT_NAME" \
    --branch="$PRODUCTION_BRANCH" \
    --commit-dirty=true

  if [ $? -eq 0 ]; then
    print_separator
    print_success "部署成功！"
    print_info "预览地址: https://$PROJECT_NAME.pages.dev/"
    print_info "自定义域名（需在 Cloudflare 控制台绑定）: $SITE_URL"
    print_separator
    return 0
  else
    print_separator
    print_error "部署失败"
    print_separator
    return 1
  fi
}

# ---- 状态 ----
show_status() {
  print_separator
  print_info "Cloudflare Pages 项目列表"
  print_separator
  npx wrangler pages project list
}

# ---- 本地预览 ----
preview_local() {
  print_info "启动本地预览（wrangler pages dev）..."
  npx wrangler pages dev "$OUTPUT_DIR"
}

# ---- 主函数 ----
main() {
  check_command node
  check_command npm

  case "${1:-all}" in
    build)
      build_frontend
      ;;
    deploy)
      deploy_frontend
      ;;
    status)
      show_status
      ;;
    preview)
      preview_local
      ;;
    all|"")
      print_separator
      print_info "Animal Hospital Wiki 部署脚本"
      print_info "站点 URL: $SITE_URL"
      print_separator

      build_frontend
      BUILD_STATUS=$?
      if [ $BUILD_STATUS -ne 0 ]; then exit 1; fi

      deploy_frontend
      DEPLOY_STATUS=$?

      echo ""
      if [ $DEPLOY_STATUS -eq 0 ]; then
        print_success "全部完成！🎉"
      else
        print_error "部署失败，请检查错误"
      fi
      ;;
    *)
      echo "用法: $0 {build|deploy|status|preview|all}"
      exit 1
      ;;
  esac
}

main "$@"
