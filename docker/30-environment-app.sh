#!/usr/bin/env bash
set -Ex

function apply_path {
    jsonFile=/dist/assets/deployment/app-config.json

    echo "Check that we have SITE_KEY vars"
    test -n "$SITE_KEY"
    echo "Check that we have APP_NAME vars"
    test -n "$APP_NAME"
    echo "Check that we have CDN vars"
    test -n "$CDN"
    echo "Check that we have SENTRY_ENV vars"
    test -n "$SENTRY_ENV"
    echo "Check that we have SENTRY_URL vars"
    test -n "$SENTRY_URL"
    echo "Check that we have EDITOR_URL vars"
    test -n "$EDITOR_URL"
    echo "Check that we have STF_VERSION vars"
    test -n "$STF_VERSION"
    echo "Check that we have EMAIL_DOMAIN vars"
    test -n "$EMAIL_DOMAIN"
    echo "Check that we have SAML_ENABLED vars"
    test -n "$SAML_ENABLED"


    echo "Configuring SITE_KEY vars"
    sed -i "s#STF_DOCKER_CONFIG_SITE_KEY#${SITE_KEY}#g" $jsonFile

    echo "Configuring APP_NAME vars"
    sed -i "s#STF_DOCKER_CONFIG_APP_NAME#${APP_NAME}#g" $jsonFile

    echo "Configuring APP_NAME vars"
    sed -i "s#STF_DOCKER_CONFIG_CDN#${CDN}#g" $jsonFile

    echo "Configuring SENTRY_ENV vars"
    sed -i "s#STF_DOCKER_CONFIG_SENTRY_ENV#${SENTRY_ENV}#g" $jsonFile

    echo "Configuring SENTRY_URL vars"
    sed -i "s#STF_DOCKER_CONFIG_SENTRY_URL#${SENTRY_URL}#g" $jsonFile

    echo "Configuring EDITOR_URL vars"
    sed -i "s#STF_DOCKER_CONFIG_EDITOR_URL#${EDITOR_URL}#g" $jsonFile

    echo "Configuring STF_VERSION vars"
    sed -i "s#STF_DOCKER_CONFIG_VERSION#${STF_VERSION}#g" $jsonFile

    echo "Configuring EMAIL_DOMAIN vars"
    sed -i "s#STF_DOCKER_CONFIG_EMAIL_DOMAIN#${EMAIL_DOMAIN}#g" $jsonFile

    echo "Configuring SAML_ENABLED vars"
    sed -i "s#STF_DOCKER_CONFIG_SAML_ENABLED#${SAML_ENABLED}#g" $jsonFile

    echo "Check that we have BRAND_NAME vars"
    test -n "$BRAND_NAME"
    sed -i "s#STF_DOCKER_CONFIG_BRAND_NAME#${BRAND_NAME}#g" $jsonFile
    if [ "$BRAND_NAME" == Nuclia ]; then
      echo "No re-branding";
    else
      echo "Re-branding to '$BRAND_NAME'";
      sed -i "s/Nuclia/$BRAND_NAME/" /dist/assets/i18n/**/*.json
      sed -i "s/<title>Nuclia<\/title>/<title>$BRAND_NAME<\/title>/" /dist/index.html
    fi

    if [ "$BRAND_DOMAIN" == nuclia.cloud ]; then
      echo "No re-branding domain";
    else
      echo "Re-branding to '$BRAND_DOMAIN'";
      sed -i "s/nuclia\.cloud/$BRAND_DOMAIN/" /dist/assets/i18n/**/*.json
      sed -i "s/nuclia\.com/$BRAND_DOMAIN/" /dist/assets/i18n/**/*.json
    fi

    echo "Check that we have ASSETS_PATH vars"
    test -n "$ASSETS_PATH"

    echo "Using assets from '$ASSETS_PATH'";
    sed -i "s#STF_DOCKER_CONFIG_ASSETS_PATH#${ASSETS_PATH}#g" $jsonFile
    sed -i -E "s#assets\/(overrides|logos|favicon)#${ASSETS_PATH}/\1#g" /dist/index.html
}

# Should we monkey patch?
test -n "$APP_NAME" && apply_path

echo "Configured"
