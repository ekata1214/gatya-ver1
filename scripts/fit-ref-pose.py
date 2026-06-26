#!/usr/bin/env python3
"""Fit hex cylinder params against reference screen targets (Three.js projection)."""
import json
import math
import numpy as np

DEG = math.pi / 180
VIEW_ASPECT = 1080 / 1920

# Reference screen targets (normalized 0-1, from r2_2 frame inspection)
TARGETS = {
    0.37: dict(cx=0.50, cy=0.44, w=0.50, h=0.24),  # slide end
    0.50: dict(cx=0.50, cy=0.47, w=0.54, h=0.26),  # formed
    0.62: dict(cx=0.50, cy=0.46, w=0.58, h=0.28),  # hold
    1.04: dict(cx=0.50, cy=0.44, w=0.64, h=0.30),  # pre-rise
}


def look_at_matrix(eye, target, up=(0, 1, 0)):
    eye = np.array(eye, float)
    target = np.array(target, float)
    up = np.array(up, float)
    z = eye - target
    z /= np.linalg.norm(z)
    x = np.cross(up, z)
    x /= np.linalg.norm(x)
    y = np.cross(z, x)
    m = np.eye(4)
    m[0, :3] = x
    m[1, :3] = y
    m[2, :3] = z
    m[:3, 3] = eye
    return m


def perspective(fov_deg, aspect, near=0.1, far=50):
    f = 1 / math.tan((fov_deg * DEG) / 2)
    m = np.zeros((4, 4))
    m[0, 0] = f / aspect
    m[1, 1] = f
    m[2, 2] = (far + near) / (near - far)
    m[2, 3] = (2 * far * near) / (near - far)
    m[3, 2] = -1
    return m


def project_points(pts, cam_pos, look_at, fov=44):
    vw, vh = VIEW_ASPECT, 1.0
    view = np.linalg.inv(look_at_matrix(cam_pos, look_at))
    proj = perspective(fov, VIEW_ASPECT)
    out = []
    for p in pts:
        v = np.array([*p, 1.0])
        clip = proj @ (view @ v)
        if clip[3] <= 0:
            continue
        ndc = clip[:3] / clip[3]
        sx = (ndc[0] + 1) * 0.5
        sy = (1 - ndc[1]) * 0.5
        out.append((sx, sy))
    return out


def rot_x(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def rot_y(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def rot_z(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def hex_radius(card_w, gap_final=0.08):
    hex_gap_start = 1.35
    base_r = card_w / (2 * math.sin(math.pi / 6))
    base_gap = math.pi / 3 - 2 * math.atan(card_w / (2 * base_r))

    def r_for(gap_scale):
        return card_w / (2 * math.tan((math.pi / 3 - base_gap * gap_scale) / 2))

    return r_for(gap_final)


def card_corners(card_w, card_h):
    hw, hh = card_w / 2, card_h / 2
    return [
        (-hw, -hh, 0), (hw, -hh, 0), (hw, hh, 0), (-hw, hh, 0),
    ]


def hex_slot(deg, radius):
    r = deg * DEG
    x = math.sin(r) * radius
    z = -math.cos(r) * radius
    ry = math.atan2(-math.sin(r), math.cos(r))
    return x, 0.0, z, ry


def sample_hex_bbox(params, anim_state):
    card_w = params['card_w']
    card_h = card_w * 1.5
    gap = params['hex_gap']
    radius = hex_radius(card_w, gap)
    upright = anim_state.get('upright', 0)
    gap_scale = 1.35 + (gap - 1.35) * upright
    radius = hex_radius(card_w, gap_scale)

    cx, cy, cz = anim_state['x'], anim_state['y'], anim_state.get('z', 0)
    rx, rz, ry_off = anim_state['rx'], anim_state['rz'], anim_state['ry_off']
    spin_y = anim_state.get('spin_y', 0)
    scale = anim_state['scale']

    tilt = rot_x(rx) @ rot_z(rz) @ rot_y(ry_off)
    spin = rot_y(spin_y)

    pts = []
    for deg in [0, 60, 120, 180, 240, 300]:
        sx, sy, sz, slot_ry = hex_slot(deg, radius)
        slot_rot = rot_y(slot_ry)
        for corner in card_corners(card_w, card_h):
            p = np.array(corner) * scale
            p = slot_rot @ p
            p += np.array([sx, sy, sz])
            p = spin @ p
            p = tilt @ p
            p += np.array([cx, cy, cz])
            pts.append(p)

    cam = (0, 0.15, 6.1)
    look = (0, -0.15, 0.25)
    scr = project_points(pts, cam, look)
    if len(scr) < 8:
        return None
    xs = [p[0] for p in scr]
    ys = [p[1] for p in scr]
    return dict(cx=(min(xs) + max(xs)) / 2, cy=(min(ys) + max(ys)) / 2,
                w=max(xs) - min(xs), h=max(ys) - min(ys))


def lerp(a, b, t):
    return a + (b - a) * t


def anim_at_time(t, p):
    d, T = 0.15, dict(slide=0.22, stand=0.12, hold=0.55, rise=0.38)
    t1 = d + T['slide']
    t2 = t1 + T['stand']
    t3 = t2 + T['hold']

    form = dict(x=p['form_x'], y=p['form_y'], rx=p['form_rx'], rz=p['form_rz'],
                ry_off=p['form_ry'], scale=p['form_scale'])
    pose = dict(x=p['pose_x'], y=p['pose_y'], rx=p['pose_rx'], rz=p['pose_rz'],
                ry_off=p['pose_ry'], scale=p['pose_scale'])

    spin_y = 0
    upright = 0
    if t < d:
        return None
    if t <= t1:
        u = (t - d) / T['slide']
        u = 1 - (1 - u) ** 2  # power2.out approx
        spin_y = u * p['gather_rot'] * math.pi * 2
        return dict(
            x=form['x'], y=form['y'], z=0,
            rx=lerp(math.pi / 2, form['rx'], u),
            rz=lerp(0, form['rz'], u),
            ry_off=lerp(0, form['ry_off'], u),
            scale=lerp(1, form['scale'], u),
            spin_y=spin_y, upright=0,
        )
    if t <= t2:
        u = (t - t1) / T['stand']
        u = 1 - (1 - u) ** 2
        return dict(
            x=lerp(form['x'], pose['x'], u),
            y=lerp(form['y'], pose['y'], u), z=0,
            rx=lerp(form['rx'], pose['rx'], u),
            rz=lerp(form['rz'], pose['rz'], u),
            ry_off=lerp(form['ry_off'], pose['ry_off'], u),
            scale=lerp(form['scale'], pose['scale'], u),
            spin_y=p['gather_rot'] * math.pi * 2, upright=0,
        )
    if t <= t3:
        u = (t - t2) / T['hold']
        upright = u
        return dict(
            x=pose['x'], y=pose['y'], z=0,
            rx=pose['rx'], rz=pose['rz'], ry_off=pose['ry_off'],
            scale=pose['scale'],
            spin_y=(p['gather_rot'] + p['hold_rot'] * u) * math.pi * 2,
            upright=upright,
        )
    return dict(
        x=pose['x'], y=pose['y'], z=0,
        rx=pose['rx'], rz=pose['rz'], ry_off=pose['ry_off'],
        scale=pose['scale'],
        spin_y=(p['gather_rot'] + p['hold_rot']) * math.pi * 2,
        upright=1,
    )


def score(params):
    err = 0
    for t, tgt in TARGETS.items():
        state = anim_at_time(t, params)
        if not state:
            return 1e9
        bb = sample_hex_bbox(params, state)
        if not bb:
            return 1e9
        err += (bb['cx'] - tgt['cx']) ** 2 * 8
        err += (bb['cy'] - tgt['cy']) ** 2 * 8
        err += (bb['w'] - tgt['w']) ** 2 * 4
        err += (bb['h'] - tgt['h']) ** 2 * 4
    return err


def main():
    rng = np.random.default_rng(42)
    best = None
    best_err = 1e9

  # seed around current + reference-centered guesses
    seeds = []
    for card_w in np.linspace(0.62, 0.92, 5):
        for form_y in np.linspace(-0.55, -0.25, 5):
            for form_rx in np.linspace(55, 78, 4):
                seeds.append(dict(
                    card_w=card_w, hex_gap=0.08,
                    form_x=0.0, form_y=form_y,
                    form_rx=form_rx * DEG, form_rz=-5 * DEG, form_ry=4 * DEG,
                    form_scale=1.0,
                    pose_x=0.0, pose_y=0.12,
                    pose_rx=16 * DEG, pose_rz=-14 * DEG, pose_ry=5 * DEG,
                    pose_scale=1.05,
                    gather_rot=2.5, hold_rot=1.0,
                ))

    for base in seeds:
        p = dict(base)
        e = score(p)
        if e < best_err:
            best_err, best = e, dict(p)
        for _ in range(120):
            q = dict(best)
            q['card_w'] += rng.normal(0, 0.02)
            q['form_y'] += rng.normal(0, 0.04)
            q['form_x'] += rng.normal(0, 0.03)
            q['form_rx'] += rng.normal(0, 2 * DEG)
            q['form_rz'] += rng.normal(0, 1.5 * DEG)
            q['form_ry'] += rng.normal(0, 1 * DEG)
            q['form_scale'] += rng.normal(0, 0.03)
            q['pose_y'] += rng.normal(0, 0.03)
            q['pose_rx'] += rng.normal(0, 1.5 * DEG)
            q['pose_rz'] += rng.normal(0, 1.5 * DEG)
            q['pose_scale'] += rng.normal(0, 0.02)
            e = score(q)
            if e < best_err:
                best_err, best = e, dict(q)

    print('best_err', best_err)
    for t in sorted(TARGETS):
        bb = sample_hex_bbox(best, anim_at_time(t, best))
        print(f"t={t}", {k: round(v, 4) for k, v in bb.items()}, 'tgt', TARGETS[t])

    out = {
        'CARD_W': round(best['card_w'], 4),
        'HEX_GAP_FINAL': best['hex_gap'],
        'FORM': dict(
            x=round(best['form_x'], 3),
            y=round(best['form_y'], 3),
            rotX_deg=round(best['form_rx'] / DEG, 2),
            rotZ_deg=round(best['form_rz'] / DEG, 2),
            rotYOff_deg=round(best['form_ry'] / DEG, 2),
            scaleMul=round(best['form_scale'], 3),
        ),
        'POSE': dict(
            x=round(best['pose_x'], 3),
            y=round(best['pose_y'], 3),
            rotX_deg=round(best['pose_rx'] / DEG, 2),
            rotZ_deg=round(best['pose_rz'] / DEG, 2),
            rotYOff_deg=round(best['pose_ry'] / DEG, 2),
            scaleMul=round(best['pose_scale'], 3),
        ),
    }
    path = '/Users/takaearasaki/Desktop/gatya/tmp-r2-ref/fit-result.json'
    with open(path, 'w') as f:
        json.dump(out, f, indent=2)
    print(json.dumps(out, indent=2))


if __name__ == '__main__':
    main()
