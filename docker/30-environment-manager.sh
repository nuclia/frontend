#!/usr/bin/env bash
set -Ex

function apply_path {
    jsonFile=/dist/assets/deployment/app-config.json

    echo "Check that we have API_PATH vars"
    test -n "$API_PATH"
    echo "Check that we have SITE_KEY vars"
    test -n "$SITE_KEY"
    echo "Check that we have APP_NAME vars"
    test -n "$APP_NAME"
    echo "Check that we have SENTRY_ENV vars"
    test -n "$SENTRY_ENV"
    echo "Check that we have SENTRY_URL vars"
    test -n "$SENTRY_URL"
    echo "Check that we have STF_VERSION vars"
    test -n "$STF_VERSION"

    echo "Configuring API_PATH vars"
    sed -i "s#STF_DOCKER_CONFIG_API_PATH#${API_PATH}#g" $jsonFile

    echo "Configuring SITE_KEY vars"
    sed -i "s#STF_DOCKER_CONFIG_SITE_KEY#${SITE_KEY}#g" $jsonFile

    echo "Configuring APP_NAME vars"
    sed -i "s#STF_DOCKER_CONFIG_APP_NAME#${APP_NAME}#g" $jsonFile

    echo "Configuring SENTRY_ENV vars"
    sed -i "s#STF_DOCKER_CONFIG_SENTRY_ENV#${SENTRY_ENV}#g" $jsonFile

    echo "Configuring SENTRY_URL vars"
    sed -i "s#STF_DOCKER_CONFIG_SENTRY_URL#${SENTRY_URL}#g" $jsonFile

    echo "Configuring STF_VERSION vars"
    sed -i "s#STF_DOCKER_CONFIG_VERSION#${STF_VERSION}#g" $jsonFile

    echo "Configuring EMAIL_DOMAIN vars"
    sed -i "s#STF_DOCKER_CONFIG_EMAIL_DOMAIN#${EMAIL_DOMAIN}#g" $jsonFile

    if [ -z "$BRAND_NAME" ]; then
      echo "No re-branding";
    else
      echo "Re-branding to '$BRAND_NAME'";
      sed -i "s/Nuclia/$BRAND_NAME/" /dist/apps/assets/i18n/**/*.json
    fi

    if [ -z "$BRAND_DOMAIN" ]; then
      echo "No re-branding domain";
    else
      echo "Re-branding to '$BRAND_DOMAIN'";
      sed -i "s/nuclia\.cloud/$BRAND_DOMAIN/" /dist/apps/assets/i18n/**/*.json
    fi
}

# Should we monkey patch?
test -n "$API_PATH" && apply_path

echo "Configured"
