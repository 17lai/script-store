define(["dom", "registrationServices", "loading", "confirm", "globalize", "connectionManager", "emby-linkbutton", "emby-collapse", "emby-input", "emby-button", "listViewStyle"], function (dom, registrationServices, loading, confirm, globalize, connectionManager) {
    "use strict";

    function load(page) {
        var apiClient;
        loading.show(), (apiClient = ApiClient).getJSON(apiClient.getUrl("Plugins/SecurityInfo")).then(function (info) {
            var key, postData;
            page.querySelector("#txtSupporterKey").value = info.SupporterKey || "", info.SupporterKey && !info.IsMBSupporter ? (page.querySelector("#txtSupporterKey").classList.add("invalidEntry"), page.querySelector(".notSupporter").classList.remove("hide")) : (page.querySelector("#txtSupporterKey").classList.remove("invalidEntry"), page.querySelector(".notSupporter").classList.add("hide")), info.IsMBSupporter ? (page.querySelector(".supporterContainer").classList.add("hide"), key = info.SupporterKey, postData = "key=" + key + "&serverId=" + ApiClient.serverId(), fetch("https://crackemby.neko.re/admin/service/registration/getStatus", {
                method: "POST",
                body: postData,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }).then(function (response) {
                return response.json()
            }).then(function (statusInfo) {
                if (statusInfo) {
                    var statusLine, indicator = page.querySelector("#status-indicator .listItemIcon"),
                        extendedPlans = page.querySelector("#extended-plans");
                    switch (extendedPlans.innerHTML = globalize.translate("MessagePremiereExtendedPlans", '<a is="emby-linkbutton" class="button-link" href="https://emby.media/premiere-ext.html" target="_blank">', "</a>"), statusInfo.deviceStatus) {
                        case 2:
                            statusLine = globalize.translate("MessagePremiereStatusOver", statusInfo.planType), indicator.classList.add("expiredBackground"), indicator.classList.remove("nearExpiredBackground"), indicator.innerHTML = "&#xE000;", extendedPlans.classList.remove("hide");
                            break;
                        case 1:
                            statusLine = globalize.translate("MessagePremiereStatusClose", statusInfo.planType), indicator.classList.remove("expiredBackground"), indicator.classList.add("nearExpiredBackground"), indicator.innerHTML = "&#xE000;", extendedPlans.classList.remove("hide");
                            break;
                        default:
                            statusLine = globalize.translate("MessagePremiereStatusGood", statusInfo.planType), indicator.classList.remove("expiredBackground"), indicator.classList.remove("nearExpiredBackground"), indicator.innerHTML = "&#xE5CA;", extendedPlans.classList.add("hide")
                    }
                    page.querySelector("#premiere-status").innerHTML = statusLine;
                    var sub, subsElement = page.querySelector("#premiere-subs");
                    statusInfo.subscriptions && 0 < statusInfo.subscriptions.length ? (page.querySelector("#premiere-subs-content").innerHTML = (subs = statusInfo.subscriptions, key = info.SupporterKey, subs.map(function (item) {
                        var itemHtml = "",
                            makeLink = item.autoRenew && "Stripe" === item.store,
                            tagName = makeLink ? "button" : "div";
                        return itemHtml += ("button" == tagName ? '<button type="button"' : "<div") + ' class="listItem listItem-button listItem-noborder' + (makeLink ? " lnkSubscription" : "") + '" data-feature="' + item.feature + '" data-key="' + key + '">', itemHtml += '<i class="listItemIcon md-icon">dvr</i>', itemHtml += '<div class="listItemBody two-line">', itemHtml += '<div class="listItemBodyText">', itemHtml += globalize.translate("ListItemPremiereSub", item.planType, item.expDate, item.store), itemHtml += "</div>", itemHtml += '<div class="listItemBodyText listItemBodyText-secondary">', itemHtml += globalize.translate("Stripe" === item.store ? item.autoRenew ? "LabelClickToCancel" : "LabelAlreadyCancelled" : "LabelCancelInfo", item.store), itemHtml += "</div>", itemHtml += "</div>", itemHtml += "</" + tagName + ">"
                    })), (sub = page.querySelector(".lnkSubscription")) && sub.addEventListener("click", cancelSub), subsElement.classList.remove("hide")) : subsElement.classList.add("hide"), page.querySelector(".isSupporter").classList.remove("hide")
                }
                var subs, key
            })) : (page.querySelector(".supporterContainer").classList.remove("hide"), page.querySelector(".isSupporter").classList.add("hide")), loading.hide()
        })
    }

    function cancelSub(e) {
        console.log("Cancel ");
        var feature = this.getAttribute("data-feature"),
            key = this.getAttribute("data-key");
        confirm({
            title: globalize.translate("HeaderCancelSub"),
            text: globalize.translate("MessageConfirmSubCancel"),
            confirmText: globalize.translate("ButtonCancelSub"),
            cancelText: globalize.translate("ButtonDontCancelSub"),
            primary: "cancel"
        }).then(function () {
            console.log("after confirm"), fetch("https://mb3admin.com/admin/service/stripe/requestSubCancel", {
                method: "POST",
                body: "key=" + key + "&feature=" + feature,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }).then(function (response) {
                alertText({
                    text: globalize.translate("MessageSubCancelReqSent"),
                    title: globalize.translate("HeaderConfirmation")
                })
            }, function (response) {
                alertText({
                    text: globalize.translate("MessageSubCancelError", "cancel@emby.media")
                })
            })
        })
    }

    function retrieveSupporterKey(e) {
        loading.show();
        var email = this.querySelector("#txtEmail").value,
            url = "https://mb3admin.com/admin/service/supporter/retrievekey?email=" + email;
        return console.log(url), fetch(url, {
            method: "POST"
        }).then(function (response) {
            return response.json()
        }).then(function (result) {
            loading.hide(), result.Success ? require(["toast"], function (toast) {
                toast(globalize.translate("MessageKeyEmailedTo").replace("{0}", email))
            }) : require(["toast"], function (toast) {
                toast(result.ErrorMessage)
            }), console.log(result)
        }), e.preventDefault(), !1
    }

    function alertText(options) {
        require(["alert"], function (alert) {
            alert(options)
        })
    }

    function updateSupporterKey(e) {
        loading.show();
        var form = this,
            key = form.querySelector("#txtSupporterKey").value,
            info = {
                SupporterKey: key
            };
        return ApiClient.updatePluginSecurityInfo(info).then(function () {
            loading.hide(), alertText(key ? {
                text: globalize.translate("MessageKeyUpdated"),
                title: globalize.translate("HeaderConfirmation")
            } : {
                text: globalize.translate("MessageKeyRemoved"),
                title: globalize.translate("HeaderConfirmation")
            }), connectionManager.resetRegistrationInfo(ApiClient), load(form.closest(".page"))
        }, function () {
            loading.hide(), connectionManager.resetRegistrationInfo(ApiClient), load(form.closest(".page"))
        }), e.preventDefault(), !1
    }

    function onSupporterLinkClick(e) {
        registrationServices.showPremiereInfo(), e.preventDefault(), e.stopPropagation()
    }
    return function (view, params) {
        view.querySelector("#supporterKeyForm").addEventListener("submit", updateSupporterKey), view.querySelector("#lostKeyForm").addEventListener("submit", retrieveSupporterKey), view.querySelector(".benefits").innerHTML = globalize.translate("HeaderSupporterBenefit", '<a is="emby-linkbutton" class="lnkPremiere button-link" href="https://emby.media/premiere" target="_blank">', "</a>"), view.querySelector(".lnkPremiere").addEventListener("click", onSupporterLinkClick), view.addEventListener("viewshow", function () {
            load(this)
        })
    }
});